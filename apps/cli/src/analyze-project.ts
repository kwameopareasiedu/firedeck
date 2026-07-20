import { assertFiredeckRootDir, getProjectPaths, NOT_FOUND_URL_PATH } from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import { camelCase } from "lodash";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { FiredeckConfig } from "shared/firedeck-config";
import {
  BackendModule,
  BackendModuleFunction,
  ClientModule,
  ClientModuleRoute,
  ProjectModel,
} from "@/types";

/** Regex matcher for a line of the root .env file (E.g. MAIN__VITE_FOO=bar) */
const ENV_VAR_LINE_MATCH_REGEX = /^.+?__\w+=.+$/;
/** Regex matcher for splitting the module name from a line of the root .env file (E.g. MAIN__) */
const ENV_VAR_LINE_SPLIT_REGEX = /^.+?__/;
/** Module name separator of a line of the root .env file */
const ENV_VAR_KEY_VALUE_SEPARATOR = "__";
/** Pages-level not-found directory name */
const NOT_FOUND_DIR_SUFFIX = "404";

/** Analyzes a Firedeck project and generates a `ProjectModel` object from it */
export async function analyzeProject(rootDir: string): Promise<ProjectModel> {
  assertFiredeckRootDir(rootDir);

  const firedeckConfig = await getFiredeckConfig(rootDir);
  const { clientModulesDir, backendModulesDir } = getProjectPaths(rootDir);

  const clientModuleDirs = fs.existsSync(clientModulesDir)
    ? fs
        .readdirSync(clientModulesDir, { encoding: "utf-8" })
        .map((moduleName) => resolve(clientModulesDir, moduleName))
        .filter((moduleDir) => fs.lstatSync(moduleDir).isDirectory())
    : [];

  const backendModuleDirs = fs.existsSync(backendModulesDir)
    ? fs
        .readdirSync(backendModulesDir, { encoding: "utf-8" })
        .map((moduleName) => resolve(backendModulesDir, moduleName))
        .filter((moduleDir) => fs.lstatSync(moduleDir).isDirectory())
    : [];

  if (clientModuleDirs.length === 0 && backendModuleDirs.length === 0)
    throw "no modules found in project";

  const projectClients = clientModuleDirs.map((clientModulesDir) =>
    analyzeClientModule(rootDir, clientModulesDir),
  );

  const projectBackends = backendModuleDirs.map((backendModuleDir) =>
    analyzeBackendModule(rootDir, backendModuleDir),
  );

  return {
    config: firedeckConfig,
    clients: projectClients,
    backends: projectBackends,
  };
}

/** Analyzes a client module directory, and builds a `ClientModule` object for it  */
function analyzeClientModule(rootDir: string, clientModuleDir: string): ClientModule {
  const { getClientModulePagesDir, getClientModuleIndexHtmlFile } = getProjectPaths(rootDir);
  const moduleName = clientModuleDir.split(sep).slice(-1)[0];

  const pagesDir = getClientModulePagesDir(moduleName);
  if (!fs.existsSync(pagesDir)) throw `${relative(rootDir, pagesDir)}: directory not found`;

  const clientRoutes = discoverRoutes(rootDir, pagesDir, pagesDir);

  const htmlFile = getClientModuleIndexHtmlFile(moduleName);
  if (!fs.existsSync(htmlFile)) throw `${relative(rootDir, htmlFile)}: file not found`;
  const htmlContent = fs.readFileSync(htmlFile, { encoding: "utf-8" });

  return {
    name: moduleName,
    routes: clientRoutes,
    indexHtml: htmlContent,
    env: getModuleEnv(rootDir, moduleName),
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

/**
 * Recursively traverses the given `dir` directory path, building a nested `ClientModuleRoute`
 * object, which is later used to create the nested route object for React Router.
 */
function discoverRoutes(rootDir: string, dir: string, pagesDir: string): ClientModuleRoute {
  const { modulesDir } = getProjectPaths(rootDir);

  const relativeDir = relative(rootDir, dir);
  const dirContents = fs.readdirSync(dir, { encoding: "utf-8" }).map((name) => resolve(dir, name));
  const dirDirs = dirContents.filter((item) => fs.lstatSync(item).isDirectory());
  const dirFiles = dirContents.filter((item) => fs.lstatSync(item).isFile());
  const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

  const getNameAndImportPath = (itemPath?: string): [null, null] | [string, string] => {
    if (!itemPath) return [null, null];

    const rawItemName = getPathFileName(itemPath);
    const itemName = rawItemName[0].toUpperCase() + camelCase(rawItemName).slice(1);
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

  const guardFiles = dirFiles.filter((itemPath) => itemPath.endsWith("guard.ts"));
  if (guardFiles.length > 1) throw `${relativeDir} contains multiple guard files`;
  const [guardName, guardImportPath] = getNameAndImportPath(guardFiles[0]);

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
      guardName: null,
      guardImportPath: null,
      urlPath: null,
      children: [
        {
          pageName: pageName,
          pageImportPath: pageImportPath,
          layoutName: null,
          layoutImportPath: null,
          placeholderName: null,
          placeholderImportPath: null,
          guardName: guardName,
          guardImportPath: guardImportPath,
          urlPath: urlPath,
          children: [],
        },
        ...dirDirsWith404Last.map((childDir) => {
          return discoverRoutes(rootDir, childDir, pagesDir);
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
    guardName: guardName,
    guardImportPath: guardImportPath,
    urlPath: urlPath,
    children: dirDirs.map((childDir) => {
      return discoverRoutes(rootDir, childDir, pagesDir);
    }),
  };
}

/** Transpiles and executes the root `firedeck.config.ts`, returning the configuration object */
export async function getFiredeckConfig(rootDir: string) {
  assertFiredeckRootDir(rootDir);

  const { configFile, workspaceConfigFile, workspaceConfigTypesFile } = getProjectPaths(rootDir);

  const [codeBundle, typesBundle] = await Promise.all([
    rollup({
      input: configFile,
      plugins: [nodeResolve(), commonjs(), typescript()],
      treeshake: { moduleSideEffects: false },
    }),
    rollup({
      input: configFile,
      plugins: [typescript(), dts({})],
      external: ["firedeck"],
    }),
  ]);

  await Promise.all([
    codeBundle.write({ file: workspaceConfigFile, format: "esm" }),
    typesBundle.write({ file: workspaceConfigTypesFile }),
  ]);

  await Promise.all([codeBundle.close(), typesBundle.close()]);

  return await import(workspaceConfigFile).then((mod) => mod.default as FiredeckConfig);
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
