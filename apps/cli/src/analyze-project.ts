import {
  assertFiredeckRootDir,
  FiredeckMode,
  getProjectPaths,
  NOT_FOUND_URL_PATH,
  pascalCase,
  reduceAsync,
  runFirebaseCmd,
} from "@/utils";
import { relative, resolve, sep } from "node:path";
import { parseEnv } from "node:util";
import fs from "fs-extra";
import { camelCase } from "lodash";
import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import {
  FirebaseAppConfig,
  FiredeckResolvedConfig,
  FiredeckUserConfig,
  ModuleFirebaseConfig,
} from "shared/firedeck-config";
import {
  BackendModule,
  BackendModuleFunction,
  ClientModule,
  ClientModuleRoute,
  FiredeckProject,
} from "@/types";
import type { UserConfig as ViteModuleConfig } from "vite";

interface FirebaseApp {
  name: string;
  displayName: string;
  appId: string;
  apiKeyId: string;
  state: string;
  expireTime: string;
}

interface FirebaseHostingSite {
  name: string;
  defaultUrl: string;
  type: string;
}

/** Regex matcher for a line of the root .env file (E.g. MAIN__VITE_FOO=bar) */
const ENV_VAR_LINE_MATCH_REGEX = /^.+?__\w+=.+$/;
/** Regex matcher for splitting the module name from a line of the root .env file (E.g. MAIN__) */
const ENV_VAR_LINE_SPLIT_REGEX = /^.+?__/;
/** Module name separator of a line of the root .env file */
const ENV_VAR_KEY_VALUE_SEPARATOR = "__";
/** Pages-level not-found directory name */
const NOT_FOUND_DIR_SUFFIX = "404";
/** Id for demo firebase project */
const DEMO_FIREBASE_PROJECT_ID = "demo-firedeck";
/** Alias for demo firebase project */
const DEMO_FIREBASE_PROJECT_ALIAS = "demo";
/** Default Firestore rules */
const DEFAULT_FIRESTORE_RULES = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;
/** Default Storage rules */
const DEFAULT_STORAGE_RULES = `
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /** {
      allow read, write: if false;
    }
  }
}`;

/** Analyzes a Firedeck project and generates a `FiredeckProject` object from it */
export async function analyzeProject(
  rootDir: string,
  mode: FiredeckMode,
  opts?: { firebaseProjectAlias?: string },
): Promise<FiredeckProject> {
  assertFiredeckRootDir(rootDir);

  const { clientModulesDir, backendModulesDir, getClientModuleDir, getBackendModuleDir } =
    getProjectPaths(rootDir);

  const clientModuleDirs = fs.existsSync(clientModulesDir)
    ? fs
        .readdirSync(clientModulesDir, { encoding: "utf-8" })
        .map((moduleName) => getClientModuleDir(moduleName))
        .filter((moduleDir) => fs.lstatSync(moduleDir).isDirectory())
    : [];

  const backendModuleDirs = fs.existsSync(backendModulesDir)
    ? fs
        .readdirSync(backendModulesDir, { encoding: "utf-8" })
        .map((moduleName) => getBackendModuleDir(moduleName))
        .filter((moduleDir) => fs.lstatSync(moduleDir).isDirectory())
    : [];

  const clients = clientModuleDirs.map((clientModulesDir) =>
    analyzeClientModule(rootDir, clientModulesDir),
  );

  const backends = backendModuleDirs.map((backendModuleDir) =>
    analyzeBackendModule(rootDir, backendModuleDir),
  );

  if (clients.length === 0 && backends.length === 0) throw "no modules found in project";

  const firedeckConfig = await analyzeFiredeckConfig(
    rootDir,
    clients,
    mode,
    opts?.firebaseProjectAlias,
  );

  for (const client of clients) {
    for (const backend of backends) {
      if (backend.name === client.name)
        throw `duplicate module names not allowed: ${backend.name} `;
    }
  }

  if (backends.length > 0) {
    if (!firedeckConfig.firebase.firestore.rules) throw `invalid firebase firestore config`;
    if (!firedeckConfig.firebase.storage.rules) throw `invalid firebase storage config`;
  }

  return {
    config: firedeckConfig,
    clients: clients,
    backends: backends,
  };
}

/** Analyzes a client module directory, and builds a `ClientModule` object for it  */
function analyzeClientModule(rootDir: string, clientModuleDir: string): ClientModule {
  const { getClientModulePagesDir, getClientModuleIndexHtmlFile, getClientModulePublicDir } =
    getProjectPaths(rootDir);
  const moduleName = clientModuleDir.split(sep).slice(-1)[0];

  const pagesDir = getClientModulePagesDir(moduleName);
  if (!fs.existsSync(pagesDir)) throw `${relative(rootDir, pagesDir)}: directory not found`;

  /**
   * Recursively traverses the given `dir` directory path, building a nested `ClientModuleRoute`
   * object, which is later used to create the nested route object for React Router.
   */
  const discoverRoutes = (rootDir: string, dir: string): ClientModuleRoute => {
    const { modulesDir } = getProjectPaths(rootDir);

    const relativeDir = relative(rootDir, dir);
    const dirContents = fs
      .readdirSync(dir, { encoding: "utf-8" })
      .map((name) => resolve(dir, name));
    const dirDirs = dirContents.filter((item) => fs.lstatSync(item).isDirectory());
    const dirFiles = dirContents.filter((item) => fs.lstatSync(item).isFile());
    const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

    const getNameAndImportPath = (itemPath?: string): [null, null] | [string, string] => {
      if (!itemPath) return [null, null];

      const rawItemName = getPathFileName(itemPath);
      const itemName = pascalCase(rawItemName);
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(itemName))
        throw `${relative(modulesDir, itemPath)}: filename cannot be resolved to valid variable name: "${itemName}"`;

      const itemImportPath = `@/${relative(modulesDir, itemPath)}`;
      return [itemName, itemImportPath];
    };

    const pageFiles = dirFiles.filter((itemPath) => itemPath.endsWith("page.tsx"));
    if (dirIsRoutable && pageFiles.length > 1) {
      throw `${relativeDir} contains multiple page files`;
    } else if (!dirIsRoutable && pageFiles.length > 0) {
      throw `${relativeDir} is not routable but contains a page file: ${pageFiles[0]}`;
    }
    const [pageName, pageImportPath] = getNameAndImportPath(pageFiles[0]);

    const layoutFiles = dirFiles.filter((itemPath) => itemPath.endsWith("layout.tsx"));
    if (layoutFiles.length > 1) throw `${relativeDir} contains multiple layout files`;
    const [layoutName, layoutImportPath] = getNameAndImportPath(layoutFiles[0]);

    const placeholderFiles = dirFiles.filter((itemPath) => itemPath.endsWith("placeholder.tsx"));
    if (placeholderFiles.length > 1) throw `${relativeDir} contains multiple placeholder files`;
    const [placeholderName, placeholderImportPath] = getNameAndImportPath(placeholderFiles[0]);

    const beforeFiles = dirFiles.filter((itemPath) => itemPath.endsWith("before.ts"));
    if (beforeFiles.length > 1) throw `${relativeDir} contains multiple before files`;
    const [beforeName, beforeImportPath] = getNameAndImportPath(beforeFiles[0]);

    const urlPath = (() => {
      if (!pageImportPath) return null;
      if (dir.endsWith(NOT_FOUND_DIR_SUFFIX)) return NOT_FOUND_URL_PATH;

      return (
        "/" +
        relative(pagesDir, dir)
          .split(sep)
          .filter((segment) => !/^\(\w+\)$/.test(segment))
          .map((segment) => {
            const pathParamRegex = /^\[(\w+)]$/;

            if (!pathParamRegex.test(segment)) return segment;

            const matches = pathParamRegex.exec(segment);
            if (!matches) return segment;

            return ":" + matches[1];
          })
          .join("/")
      );
    })();

    if ((pageImportPath && layoutImportPath) || urlPath === "/") {
      const dirDirsWith404Last = (() => {
        if (urlPath !== "/" || dirDirs.every((dir) => !dir.endsWith(NOT_FOUND_DIR_SUFFIX)))
          return dirDirs;

        const newDirDirs = [...dirDirs];
        const notFoundDir = newDirDirs.find((dir) => dir.endsWith(NOT_FOUND_DIR_SUFFIX))!;
        newDirDirs.splice(newDirDirs.indexOf(notFoundDir), 1);
        newDirDirs.push(notFoundDir);
        return newDirDirs;
      })();

      return {
        pageName: null,
        pageImportPath: null,
        layoutName: layoutName,
        layoutImportPath: layoutImportPath,
        placeholderName: placeholderName,
        placeholderImportPath: placeholderImportPath,
        beforeName: null,
        beforeImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: pageName,
            pageImportPath: pageImportPath,
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            beforeName: beforeName,
            beforeImportPath: beforeImportPath,
            urlPath: urlPath,
            children: [],
          },
          ...dirDirsWith404Last.map((childDir) => {
            return discoverRoutes(rootDir, childDir);
          }),
        ],
      };
    }

    return {
      pageName: pageName,
      pageImportPath: pageImportPath,
      layoutName: layoutName,
      layoutImportPath: layoutImportPath,
      placeholderName: placeholderName,
      placeholderImportPath: placeholderImportPath,
      beforeName: beforeName,
      beforeImportPath: beforeImportPath,
      urlPath: urlPath,
      children: dirDirs.map((childDir) => {
        return discoverRoutes(rootDir, childDir);
      }),
    };
  };

  const clientRoutes = discoverRoutes(rootDir, pagesDir);

  const htmlFile = getClientModuleIndexHtmlFile(moduleName);
  if (!fs.existsSync(htmlFile)) throw `${relative(rootDir, htmlFile)}: file not found`;
  const htmlContent = fs.readFileSync(htmlFile, { encoding: "utf-8" });

  const publicDir = getClientModulePublicDir(moduleName);
  if (!fs.existsSync(publicDir)) throw `${relative(rootDir, publicDir)}: directory not found`;

  const publicLastModifiedTimestamp = fs
    .readdirSync(publicDir, { recursive: true, encoding: "utf-8" })
    .filter((filename) => fs.lstatSync(resolve(publicDir, filename)).isFile())
    .reduce((modifiedTimestamp, filename) => {
      const filepath = resolve(publicDir, filename);
      const fileModifiedTimestamp = fs.lstatSync(filepath).mtimeMs;
      return Math.max(modifiedTimestamp, fileModifiedTimestamp);
    }, 0);

  return {
    name: moduleName,
    routes: clientRoutes,
    indexHtml: htmlContent,
    env: getModuleEnv(rootDir, moduleName),
    publicLastModifiedTs: publicLastModifiedTimestamp,
  };
}

/** Analyzes a backend module directory, and builds a `BackendModule` object for it  */
function analyzeBackendModule(rootDir: string, backendModuleDir: string): BackendModule {
  const { modulesDir, getBackendModuleFunctionsDir } = getProjectPaths(rootDir);

  const moduleName = backendModuleDir.split(sep).slice(-1)[0];

  const functionsDir = getBackendModuleFunctionsDir(moduleName);
  if (!fs.existsSync(functionsDir)) throw `${relative(rootDir, functionsDir)}: directory not found`;

  const functionFiles = fs
    .readdirSync(functionsDir, { encoding: "utf-8", recursive: true })
    .map((name) => resolve(functionsDir, name))
    .filter((filepath) => fs.lstatSync(filepath).isFile() && filepath.endsWith(".ts"));

  const moduleFunctions = functionFiles.map((filepath) => {
    const name = camelCase(`${moduleName}_${getPathFileName(filepath)}`);
    const importPath = `@/${relative(modulesDir, filepath)}`;

    return { name, importPath } satisfies BackendModuleFunction as BackendModuleFunction;
  });

  return {
    name: moduleName,
    functions: moduleFunctions,
    env: getModuleEnv(rootDir, moduleName),
  };
}

/** Transpiles and executes the root `firedeck.config.ts`, returning the configuration object */
async function analyzeFiredeckConfig(
  rootDir: string,
  clients: ClientModule[],
  mode: FiredeckMode,
  firebaseProjectAlias?: string,
) {
  assertFiredeckRootDir(rootDir);

  const { configFile, workspaceConfigFile } = getProjectPaths(rootDir);

  const userFiredeckConfig = await rollup({
    input: configFile,
    plugins: [nodeResolve(), commonjs(), typescript()],
    treeshake: { moduleSideEffects: false },
    onwarn: (warning, defaultHandler) => {
      if (!warning.message.includes("allowImportingTsExtensions")) {
        defaultHandler(warning);
      }
    },
  })
    .then((bundle) => bundle.write({ file: workspaceConfigFile, format: "esm" }).then(() => bundle))
    .then((bundle) => bundle.close())
    .then(() => import(workspaceConfigFile).then((e) => e.default as FiredeckUserConfig));

  fs.removeSync(workspaceConfigFile);

  const clientViteConfigMap = await reduceAsync(
    clients,
    async (config, client) => {
      const clientViteConfig: ViteModuleConfig = !userFiredeckConfig.vite
        ? {}
        : typeof userFiredeckConfig.vite === "function"
          ? await userFiredeckConfig.vite({
              mode: mode,
              moduleName: client.name,
              env: parseEnv(client.env),
            })
          : userFiredeckConfig.vite;

      return { ...config, [client.name]: clientViteConfig };
    },
    {} as Record<string, ViteModuleConfig>,
  );

  let fetchedFirebaseApps = false;
  const firebaseApps: FirebaseApp[] = [];

  let fetchedFirebaseHostingSites = false;
  const firebaseHostingSites: FirebaseHostingSite[] = [];

  const firebaseProjectTuple = firebaseProjectAlias
    ? userFiredeckConfig.firebase?.projects?.[firebaseProjectAlias]
    : ([DEMO_FIREBASE_PROJECT_ID, ""] as const);
  if (!firebaseProjectTuple) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

  const [firebaseProjectId, uniqueSuffix] = firebaseProjectTuple;

  const clientFirebaseConfigMap = clients.reduce(
    (configs, client) => {
      if (firebaseProjectId === DEMO_FIREBASE_PROJECT_ID) {
        return {
          ...configs,
          [client.name]: {
            app: {
              apiKey: "demo-firedeck-api-key",
              authDomain: "demo-firedeck.firebaseapp.com",
              projectId: "demo-firedeck",
              storageBucket: "demo-firedeck.firebasestorage.app",
              messagingSenderId: "demo-firedeck-messaging-sender-id",
              appId: "demo-firedeck-app-id",
              measurementId: "demo-firedeck-measurement-id",
              projectNumber: "123456789",
              version: "2",
            },
            hosting: {
              siteId: `demo-firedeck-${client.name}-site`,
            },
          },
        };
      }

      const clientEntityName = `${firebaseProjectId}-${client.name}${uniqueSuffix}`;

      if (!fetchedFirebaseApps) {
        firebaseApps.push(...runFirebaseCmd<FirebaseApp[]>("apps:list", firebaseProjectId));
        fetchedFirebaseApps = true;
      }

      const clientFirebaseApp =
        firebaseApps.find((app) => app.displayName === clientEntityName) ??
        runFirebaseCmd<FirebaseApp>(`apps:create WEB ${clientEntityName}`, firebaseProjectId);

      const clientFirebaseAppConfig = runFirebaseCmd<{ sdkConfig: FirebaseAppConfig }>(
        `apps:sdkconfig WEB ${clientFirebaseApp.appId}`,
        firebaseProjectId,
      ).sdkConfig;

      if (!fetchedFirebaseHostingSites) {
        firebaseHostingSites.push(
          ...runFirebaseCmd<{ sites: FirebaseHostingSite[] }>(
            "hosting:sites:list",
            firebaseProjectId,
          ).sites,
        );
        fetchedFirebaseHostingSites = true;
      }

      if (!firebaseHostingSites.find((site) => site.name.endsWith(clientEntityName))) {
        runFirebaseCmd<FirebaseHostingSite>(
          `hosting:sites:create ${clientEntityName}`,
          firebaseProjectId,
        );
      }

      return {
        ...configs,
        [client.name]: {
          app: clientFirebaseAppConfig,
          hosting: { siteId: clientEntityName },
        },
      };
    },
    {} as Record<string, ModuleFirebaseConfig>,
  );

  const resolvedFiredeckConfig: FiredeckResolvedConfig = {
    packageManager: userFiredeckConfig.packageManager,
    vite: { modules: clientViteConfigMap },
    firebase: {
      project: {
        id: firebaseProjectId,
        alias: firebaseProjectAlias ?? DEMO_FIREBASE_PROJECT_ALIAS,
        demo: (firebaseProjectAlias ?? DEMO_FIREBASE_PROJECT_ALIAS) === DEMO_FIREBASE_PROJECT_ALIAS,
      },
      modules: clientFirebaseConfigMap,
      firestore: {
        indexes: userFiredeckConfig.firebase?.firestore?.indexes ?? [],
        rules: userFiredeckConfig.firebase?.firestore?.rules ?? DEFAULT_FIRESTORE_RULES,
      },
      storage: {
        rules: userFiredeckConfig.firebase?.storage?.rules ?? DEFAULT_STORAGE_RULES,
      },
    },
  };

  return resolvedFiredeckConfig;
}

/** Parses the root env file and returns the env string specific to the given module name */
function getModuleEnv(rootDir: string, moduleName: string) {
  const { envFile } = getProjectPaths(rootDir);

  if (!fs.existsSync(envFile)) throw `${relative(rootDir, envFile)}: file not found`;

  const envContent = fs.readFileSync(envFile, { encoding: "utf-8" });
  const moduleEnvVariables = envContent
    .trim()
    .split("\n")
    .filter((line) => {
      if (!ENV_VAR_LINE_MATCH_REGEX.test(line)) return false;

      const [key] = line.trim().split(ENV_VAR_KEY_VALUE_SEPARATOR);
      return key.toLowerCase() === moduleName.toLowerCase();
    })
    .map((line) => line.split(ENV_VAR_LINE_SPLIT_REGEX)[1]);

  return moduleEnvVariables.join("\n");
}

/**
 * Returns the file name for a given file path, properly parsing files names with multiple
 * periods (E.g. `index.page.tsx` => `index.page`)
 */
function getPathFileName(path: string) {
  const lastSegment = path.split(sep).slice(-1)[0];

  if (!lastSegment.includes(".")) return lastSegment;
  return lastSegment.substring(0, lastSegment.lastIndexOf("."));
}
