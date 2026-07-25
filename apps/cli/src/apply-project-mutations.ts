import fs from "fs-extra";
import {
  BackendModule,
  BackendModuleFunction,
  ClientModule,
  ClientModuleRoute,
  FileTree,
  FiredeckProject,
  ProjectMutation,
  RouterRoute,
} from "@/types";
import {
  assertFiredeckRootDir,
  DEMO_FIREBASE_PROJECT_ALIAS,
  getPrettierConfig,
  getProjectPaths,
  NOT_FOUND_URL_PATH,
  pascalCase,
  screamingSnakeCase,
  writeFileTree,
} from "@/utils";
import { relative } from "node:path";
import { format } from "prettier";
import { FiredeckConfig } from "shared/firedeck-config";
import { kebabCase } from "lodash";

/** Applies a list of `ProjectMutation` items to the project file system */
export async function applyProjectMutations(
  rootDir: string,
  firedeckProject: FiredeckProject,
  mutations: ProjectMutation[],
  opts?: { firebaseProjectAlias?: string },
) {
  assertFiredeckRootDir(rootDir);

  const firebaseProjectAlias = opts?.firebaseProjectAlias ?? DEMO_FIREBASE_PROJECT_ALIAS;

  const {
    getClientModulePublicDir,
    getClientSdkFile,
    runtimeDir,
    getRuntimeClientModuleDir,
    getRuntimeClientModuleDistDir,
    getRuntimeClientModuleFiredeckConfigFile,
    getRuntimeClientModuleFiredeckConfigTypesFile,
    getRuntimeClientModuleIndexHtmlFile,
    getRuntimeClientModuleEnvFile,
    getRuntimeClientModuleRoutesFile,
    getRuntimeClientModulePublicDir,
    getRuntimeBackendModuleDir,
    getRuntimeBackendModuleFunctionsFile,
    getRuntimeBackendModuleEnvFile,
    runtimeFirebaseRcFile,
    runtimeFirebaseJsonFile,
    runtimeFirebaseFirestoreJsonFile,
    runtimeFirebaseFirestoreRulesFile,
    runtimeFirebaseStorageRulesFile,
    workspaceClientEnvTypesFile,
    workspaceBackendEnvTypesFile,
    workspaceConfigFile,
    workspaceConfigTypesFile,
  } = getProjectPaths(rootDir);

  for (const mut of mutations) {
    switch (mut.type) {
      case "update-workspace-env-types": {
        const clientEnvTypesSource = await generateWorkspaceClientsEnvTypesSource(
          firedeckProject.clients,
        );
        fs.ensureFileSync(workspaceClientEnvTypesFile);
        fs.writeFileSync(workspaceClientEnvTypesFile, clientEnvTypesSource);

        const backendEnvTypesSource = await generateWorkspaceBackendsEnvTypesSource(
          firedeckProject.backends,
        );
        fs.ensureFileSync(workspaceBackendEnvTypesFile);
        fs.writeFileSync(workspaceBackendEnvTypesFile, backendEnvTypesSource);
        break;
      }
      case "create-runtime": {
        fs.removeSync(runtimeDir);
        fs.ensureDirSync(runtimeDir);

        const runtimeFileTree = generateRuntimeFileTree(
          firedeckProject.config.packageManager.name,
          firedeckProject.config.packageManager.version,
          firedeckProject.backends,
          firebaseProjectAlias,
        );
        await writeFileTree(runtimeDir, runtimeFileTree);
        break;
      }
      case "update-runtime": {
        const runtimeFileTree = generateRuntimeFileTree(
          firedeckProject.config.packageManager.name,
          firedeckProject.config.packageManager.version,
          firedeckProject.backends,
          firebaseProjectAlias,
        );
        await writeFileTree(runtimeDir, runtimeFileTree);

        for (const client of firedeckProject.clients) {
          const configDestPath = getRuntimeClientModuleFiredeckConfigFile(client.name);
          const typesDestPath = getRuntimeClientModuleFiredeckConfigTypesFile(client.name);
          fs.copyFileSync(workspaceConfigFile, configDestPath);
          fs.copyFileSync(workspaceConfigTypesFile, typesDestPath);
        }

        const firebaseRcSource = await generateFirebaseRcSource(
          firedeckProject.config,
          firedeckProject.clients,
        );
        fs.ensureFileSync(runtimeFirebaseRcFile);
        fs.writeFileSync(runtimeFirebaseRcFile, firebaseRcSource);

        const firebaseJsonSource = await generateFirebaseJsonSource(
          firedeckProject.clients,
          firedeckProject.backends,
          runtimeDir,
          getRuntimeClientModuleDistDir,
          getRuntimeBackendModuleDir,
        );
        fs.ensureFileSync(runtimeFirebaseJsonFile);
        fs.writeFileSync(runtimeFirebaseJsonFile, firebaseJsonSource);

        const firestoreJsonSource = await generateFirebaseFirestoreJsonSource(
          firedeckProject.config,
          firebaseProjectAlias,
        );
        fs.ensureFileSync(runtimeFirebaseFirestoreJsonFile);
        fs.writeFileSync(runtimeFirebaseFirestoreJsonFile, firestoreJsonSource);

        const firestoreRulesSource = generateFirebaseFirestoreRulesSource(
          firedeckProject.config,
          firebaseProjectAlias,
        );
        fs.ensureFileSync(runtimeFirebaseFirestoreRulesFile);
        fs.writeFileSync(runtimeFirebaseFirestoreRulesFile, firestoreRulesSource);

        const storageRuleSource = generateFirebaseStorageRulesSource(
          firedeckProject.config,
          firebaseProjectAlias,
        );
        fs.ensureFileSync(runtimeFirebaseStorageRulesFile);
        fs.writeFileSync(runtimeFirebaseStorageRulesFile, storageRuleSource);

        break;
      }
      case "add-runtime-client": {
        const clientRoot = getRuntimeClientModuleDir(mut.clientName);
        const clientFileTree = generateRuntimeClientFileTree(
          mut.clientName,
          firedeckProject.backends,
        );
        await writeFileTree(clientRoot, clientFileTree);
        break;
      }
      case "update-runtime-client-html": {
        const htmlDest = getRuntimeClientModuleIndexHtmlFile(mut.clientName);
        const client = firedeckProject.clients.find((mod) => mod.name === mut.clientName);
        fs.ensureFileSync(htmlDest);
        fs.writeFileSync(htmlDest, client!.indexHtml);
        break;
      }
      case "update-runtime-client-env": {
        const envDest = getRuntimeClientModuleEnvFile(mut.clientName);
        const client = firedeckProject.clients.find((mod) => mod.name === mut.clientName);
        fs.ensureFileSync(envDest);
        fs.writeFileSync(envDest, client!.env);
        break;
      }
      case "update-runtime-client-public-dir": {
        const clientPublicDir = getClientModulePublicDir(mut.clientName);
        const clientRuntimePublicDir = getRuntimeClientModulePublicDir(mut.clientName);
        fs.removeSync(clientRuntimePublicDir);
        fs.copySync(clientPublicDir, clientRuntimePublicDir);
        break;
      }
      case "update-runtime-client-sdk": {
        const client = firedeckProject.clients.find((mod) => mod.name === mut.clientName);

        const clientSdkFile = getClientSdkFile(mut.clientName);
        const { config, backends, alias } = { ...firedeckProject, alias: firebaseProjectAlias };
        const sdkSource = await generateClientSdkSource(config, client!, backends, alias);
        fs.ensureFileSync(clientSdkFile);
        fs.writeFileSync(clientSdkFile, sdkSource);

        const clientRoutesFile = getRuntimeClientModuleRoutesFile(mut.clientName);
        const runtimeClientRoutesSource = await generateRuntimeClientRoutesSource(client!.routes);
        fs.ensureFileSync(clientRoutesFile);
        fs.writeFileSync(clientRoutesFile, runtimeClientRoutesSource);
        break;
      }
      case "rename-runtime-client": {
        const oldClientRoot = getRuntimeClientModuleDir(mut.oldName);
        const newClientRoot = getRuntimeClientModuleDir(mut.newName);
        fs.renameSync(oldClientRoot, newClientRoot);
        break;
      }
      case "remove-runtime-client": {
        const clientRoot = getRuntimeClientModuleDir(mut.clientName);
        fs.removeSync(clientRoot);
        break;
      }
      case "add-runtime-backend": {
        const backendRoot = getRuntimeBackendModuleDir(mut.backendName);
        const backendFileTree = generateRuntimeBackendFileTree(mut.backendName);
        await writeFileTree(backendRoot, backendFileTree);
        break;
      }
      case "rename-runtime-backend": {
        const oldBackendRoot = getRuntimeBackendModuleDir(mut.oldName);
        const newBackendRoot = getRuntimeBackendModuleDir(mut.newName);
        fs.renameSync(oldBackendRoot, newBackendRoot);
        break;
      }
      case "update-runtime-backend-functions": {
        const { backendName } = mut;
        const backendFunctionsFile = getRuntimeBackendModuleFunctionsFile(backendName);
        const backend = firedeckProject.backends.find((mod) => mod.name === mut.backendName);
        const functionsSource = await generateRuntimeBackendFunctionsSource(backend!.functions);
        fs.ensureFileSync(backendFunctionsFile);
        fs.writeFileSync(backendFunctionsFile, functionsSource);
        break;
      }
      case "update-runtime-backend-env": {
        const envDest = getRuntimeBackendModuleEnvFile(mut.backendName);
        const backend = firedeckProject.backends.find((mod) => mod.name === mut.backendName);
        fs.ensureFileSync(envDest);
        fs.writeFileSync(envDest, backend!.env);
        break;
      }
      case "remove-runtime-backend": {
        const backendRoot = getRuntimeBackendModuleDir(mut.backendName);
        fs.removeSync(backendRoot);
        break;
      }
    }
  }
}

function generateWorkspaceClientsEnvTypesSource(clients: ClientModule[]) {
  const envLines = generateModuleEnvLinesSource(clients);

  const finalSource = `
  interface ViteTypeOptions {
    strictImportMetaEnv: unknown
  }

  interface ImportMetaEnv {
    ${envLines.join("\n")}
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }`;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateWorkspaceBackendsEnvTypesSource(backends: BackendModule[]) {
  const envLines = generateModuleEnvLinesSource(backends);

  const finalSource = `
  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: string;
        ${envLines.join("\n")}
      }
    }
  }
  
  export {};`;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateModuleEnvLinesSource(modules: { env: string }[]) {
  const allModuleEnvs = modules
    .reduce((envs, mod) => `${envs}${mod.env}\n`, "")
    .split("\n")
    .filter((line) => !!line);

  const keySet = new Set<string>();

  return allModuleEnvs.reduce((lines, line) => {
    const [key] = line.split("=");
    const value = line.substring(key.length + 1);
    const entry = `readonly ${key}: "${value}";`.replace(/""/g, '"');

    if (keySet.has(key)) {
      const lineIndex = lines.indexOf(lines.find((l) => l.startsWith(`readonly ${key}:`)) ?? "");

      if (lineIndex !== -1) {
        const duplicateEntry = `readonly ${key}: string;`;
        lines.splice(lineIndex, 1, "/** Defined in multiple modules */", duplicateEntry);
      }
    } else {
      lines.push(entry);
    }

    keySet.add(key);
    return [...lines];
  }, [] as string[]);
}

function generateRuntimeFileTree(
  packageManagerName: string,
  packageManagerVersion: string,
  backends: BackendModule[],
  firebaseProjectAlias: string,
): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "firedeck-runtime",
        "version": "0.0.0",
        "private": true,
        "type": "module",
        "packageManager": "${packageManagerName}@${packageManagerVersion}",
        "workspaces": [
          "modules/*"
        ],
        "scripts": {
          ${
            backends.length > 0
              ? `"dev": "../../node_modules/.bin/turbo dev emulate",`
              : `"dev": "../../node_modules/.bin/turbo dev",`
          }
          "build": "../../node_modules/.bin/turbo build",
          ${
            firebaseProjectAlias === DEMO_FIREBASE_PROJECT_ALIAS
              ? `"emulate": "../../node_modules/.bin/kill-port 4000 8080 8085 && firebase emulators:start --project demo-firedeck --import ../../temp/firebase/emulator --export-on-exit"`
              : `"emulate": "../../node_modules/.bin/kill-port 4000 8080 8085 && firebase use ${firebaseProjectAlias} && firebase emulators:start --import ../../temp/firebase/emulator --export-on-exit"`
          }
        }
      }`,
    },

    "turbo.json": {
      content: `
      {
        "$schema": "https://turbo.build/schema.json",
        "tasks": {
          "dev": {
            "persistent": true,
            "cache": false
          },
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["apps/**/dist/**", "apps/**/lib/**", "apps/**/bin/**"]
          },
          "//#emulate": {
            "persistent": true
          }
        }
      }`,
    },

    ".gitignore": {
      content: [
        ".idea",
        ".turbo",
        ".firebase",
        "node_modules",
        "dist",
        ".env",
        ".env.local",
        "*.log",
        "firebase-export-*",
      ].join("\n"),
    },

    ".firebaserc": {
      content: "{}",
      extension: "json",
    },

    "firebase.json": {
      content: "{}",
    },

    "firestore.json": {
      content: "{}",
    },

    "firestore.rules": {
      content: "",
      extension: null,
    },

    "storage.rules": {
      content: "",
      extension: null,
    },
  };
}

function generateRuntimeClientFileTree(clientName: string, backends: BackendModule[]): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "${clientName}",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "../../../../node_modules/.bin/vite",
          "build": "../../../../node_modules/.bin/tsc -b && ../../../../node_modules/.bin/vite build",
          "preview": "../../../../node_modules/.bin/vite preview"
        }
      }`,
    },

    "vite.config.ts": {
      content: `
      import { defineConfig, mergeConfig, loadEnv } from "vite";
      import react from "@vitejs/plugin-react";
      import tailwindcss from "@tailwindcss/vite";
      import { resolve } from "node:path";
      import firedeckConfig from "./firedeck.config.mjs";

      const __dirname = import.meta.dirname;

      export default defineConfig(async ({ mode }) => {
        const env = loadEnv(mode, process.cwd(), "");
        
        const configOverride = firedeckConfig.vite 
          ? await firedeckConfig.vite({ 
              moduleName: "${clientName}",
              viteMode: mode as never,
              env
            })
          : {};
      
        return mergeConfig(
          {
            plugins: [react(), tailwindcss()],
            resolve: {
              alias: {
                "@/client-sdk": resolve(__dirname, "../../../../firedeck/client-sdk"),
                "@": resolve(__dirname, "../../../../modules"),
              },
            }
          },
          configOverride
        );
      })`,
    },

    "tsconfig.app.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "isolatedModules": true,
          "moduleDetection": "force",
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "rootDir": "../../../../",
          "paths": {
            "@/*": ["../../../../modules/*", "../../../../firedeck/*"]
          },
          "types": ["vite/client"]
        },
        "include": ["./src", "./global.d.ts", "../../../../modules", "../../../../firedeck"]
      }`,
    },

    "tsconfig.node.json": {
      content: `
      {
        "compilerOptions": {
          "target": "es2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,
      
          /* Bundler mode */
          "module": "nodenext",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
      
          /* Linting */
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "erasableSyntaxOnly": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["vite.config.ts"]
      }`,
    },

    "tsconfig.json": {
      content: `
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }`,
    },

    "global.d.ts": {
      content: 'declare module "*.css";',
    },

    "index.html": {
      content: "",
    },

    "public/favicon.svg": {
      content: "",
      extension: "html",
    },

    "src/index.tsx": {
      content: `
      import "./index.css";
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { RouterProvider, createBrowserRouter } from "react-router";
      import buildRoot from "@/client/${clientName}/root.tsx";
      import routes from "./routes.ts";
      
      ${
        backends.length > 0
          ? `
          import { connectAuthEmulator } from "firebase/auth";
          import { connectFunctionsEmulator } from "firebase/functions";
          import { connectFirestoreEmulator } from "firebase/firestore";
          import { connectStorageEmulator } from "firebase/storage";
          import { auth, firestore, functions, storage } from "@/client-sdk/${kebabCase(clientName)}";
      
          if (import.meta.env.MODE === "development") {
            connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
            connectFunctionsEmulator(functions, "localhost", 5001);
            connectFirestoreEmulator(firestore, "localhost", 8080);
            connectStorageEmulator(storage, "localhost", 9199);
          }
          `
          : ""
      }
      
      const router = createBrowserRouter(routes);
      
      createRoot(document.getElementById("root")!).render(
        buildRoot(<RouterProvider router={router} />)
      );`,
    },

    "src/routes.ts": {
      content: "",
    },

    "src/index.css": {
      content: `
      @import "tailwindcss";
      @import "../../../../../modules/client/${clientName}/index.css";
      `,
    },
  };
}

function generateRuntimeClientRoutesSource(routes: ClientModuleRoute) {
  function createReplaceTarget(str: string) {
    return `$$${str}$$`;
  }

  function removeReplaceTarget(str: string) {
    return str.replace(/"?\$\$"?/gm, "");
  }

  function createDynamicImportStatement(str: string) {
    return createReplaceTarget(`() => import('${str}').then((mod) => mod.default)`);
  }

  function generateReactRouterRoute(
    route: ClientModuleRoute,
    parentPlaceholderName?: string | null,
  ): RouterRoute {
    const elementName = route.pageName || route.layoutName || undefined;

    return {
      id: elementName,
      path: route.pageImportPath ? route.urlPath! : undefined,
      loader: route.beforeImportPath ? createReplaceTarget(route.beforeName!) : undefined,
      lazy: elementName
        ? {
            Component: route.pageImportPath
              ? createDynamicImportStatement(route.pageImportPath)
              : route.layoutImportPath
                ? createDynamicImportStatement(route.layoutImportPath)
                : undefined,
          }
        : undefined,
      HydrateFallback: route.placeholderImportPath
        ? createReplaceTarget(route.placeholderName!)
        : parentPlaceholderName
          ? createReplaceTarget(parentPlaceholderName)
          : undefined,
      children:
        route.children.length > 0
          ? route.children.map((child) => generateReactRouterRoute(child, route.placeholderName))
          : undefined,
    };
  }

  const routeDeclarationSource = removeReplaceTarget(
    JSON.stringify(generateReactRouterRoute(routes)),
  );

  const routeImportSource = flattenRoutes(routes).reduce((importSrc, route) => {
    const imports = [];

    if (route.placeholderImportPath)
      imports.push(`import ${route.placeholderName} from "${route.placeholderImportPath}";`);

    if (route.beforeImportPath)
      imports.push(`import ${route.beforeName} from "${route.beforeImportPath}";`);

    return imports.length === 0 ? importSrc : importSrc + imports.join("\n") + "\n";
  }, "");

  const routerSource = `
    ${routeImportSource}

    export default [${routeDeclarationSource}];
  `;

  return format(routerSource, getPrettierConfig({ filePath: "a.tsx" }));
}

function generateRuntimeBackendFileTree(backendName: string): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "${backendName}",
        "version": "0.0.0",
        "main": "lib/index.js",
        "private": true,
        "scripts": {
          "build": "../../../../node_modules/.bin/rollup -c",
          "dev": "../../../../node_modules/.bin/rollup -c -w --no-watch.clearScreen",
        },
        "engines": {
          "node": "22"
        }
      }`,
    },

    "tsconfig.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "isolatedModules": true,
          "moduleDetection": "force",
          "noEmit": true,
          "strict": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "rootDir": "../../../../",
          "paths": {
            "@/*": ["../../../../modules/*"],
          }
        },
        "include": ["./src", "../../../../modules"]
      }`,
    },

    "rollup.config.mjs": {
      content: `
      import { defineConfig } from "rollup";
      import { dts } from "rollup-plugin-dts";
      import nodeResolve from "@rollup/plugin-node-resolve";
      import commonjs from "@rollup/plugin-commonjs";
      import typescript from "@rollup/plugin-typescript";
      import { typescriptPaths } from "rollup-plugin-typescript-paths";
      import fs from "fs-extra";
      
      const packageInfo = JSON.parse(
        fs.readFileSync("../../../../package.json", { encoding: "utf-8" })
      );

      const external = [
        ...Object.keys(packageInfo.dependencies),
        ...Object.keys(packageInfo.devDependencies),
      ].map((dep) => new RegExp(\`^\${dep}.+\`));
      
      const onWarn = (warning, defaultHandler) => {
        if (!warning.message.includes("allowImportingTsExtensions"))
          defaultHandler(warning);
      };
      
      export default defineConfig([
        {
          input: "src/index.ts",
          output: { format: "commonjs", file: "lib/index.js" },
          plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
          treeshake: { moduleSideEffects: false },
          external: external,
          onwarn: onWarn,
        },
        {
          input: "src/index.ts",
          output: { format: "commonjs", file: "lib/index.d.ts" },
          plugins: [typescript(), dts()],
          treeshake: { moduleSideEffects: false },
          external: external,
          onwarn: onWarn,
        },
      ]);`,
    },

    "src/index.ts": {
      content: `
      import { initializeApp } from "firebase-admin/app";
      initializeApp();
      
      export * from "./functions.ts";`,
    },

    "src/functions.ts": {
      content: "",
    },
  };
}

function generateRuntimeBackendFunctionsSource(functions: BackendModuleFunction[]) {
  const functionsImportSource = functions
    .map((fn) => `import ${fn.name} from "${fn.importPath}";`)
    .join("\n");

  const functionsExportSource = functions.map((fn) => `${fn.name},`).join("\n");

  const finalSource = `
    ${functionsImportSource};
    
    export {
      ${functionsExportSource}
    };
  `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateClientSdkSource(
  firedeckConfig: FiredeckConfig,
  client: ClientModule,
  backends: BackendModule[],
  firebaseProjectAlias: string,
) {
  const firebaseProject = firedeckConfig.firebase?.projects[firebaseProjectAlias];
  if (!firebaseProject) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

  const routeEnumMembersSource = flattenRoutes(client.routes).reduce((source, route) => {
    if (!route.pageName || !route.urlPath || route.urlPath === NOT_FOUND_URL_PATH) return source;

    return source + `${screamingSnakeCase(route.pageName)} = "${route.urlPath}",\n`;
  }, "");

  const routeEnumSource = `
    export enum ${pascalCase(client.name)}Route { 
      ${routeEnumMembersSource} 
    };`;

  const backendSource = backends.reduce((src, backend) => {
    return backend.functions.reduce((backendSrc, backendFunction) => {
      return `${backendSrc}
      
      import ${backendFunction.name}Fn from "${backendFunction.importPath}";
      type ArgOf${pascalCase(backendFunction.name)} = GetBackendFnArgs<typeof ${backendFunction.name}Fn>;
      type RetOf${pascalCase(backendFunction.name)} = GetBackendFnReturn<typeof ${backendFunction.name}Fn>;
      
      export async function call${pascalCase(backendFunction.name)} (args: ArgOf${pascalCase(backendFunction.name)}) {
        return httpsCallable<typeof args, Awaited<RetOf${pascalCase(backendFunction.name)}>>
            (functions, "${backendFunction.name}")(args).then((res) => res.data);
      }`;
    }, src);
  }, "");

  const finalSource = `
  /**
   * ------------------------------------------------
   * This file was generated by Firedeck. Do not edit
   * ------------------------------------------------
   */
  
  ${
    backends.length > 0
      ? `import { initializeApp } from "firebase/app";
        import { browserSessionPersistence, initializeAuth } from "firebase/auth";
        import { initializeFirestore } from "firebase/firestore";
        import { getFunctions, httpsCallable } from "firebase/functions";
        import { getStorage } from "firebase/storage";
        import { initializeAnalytics } from "firebase/analytics";
        import type { CallableFunction } from "firebase-functions/https";
        
        type GetBackendFnArgs<T> = T extends CallableFunction<infer A, unknown> ? A : never;
        type GetBackendFnReturn<T> = T extends CallableFunction<unknown, infer R> ? R : never;
        
        const firebaseConfig = ${JSON.stringify(firebaseProject.apps[client.name])};
        
        // Initialize Firebase
        export const app = initializeApp(firebaseConfig);
        export const auth = initializeAuth(app, { persistence: browserSessionPersistence });
        export const firestore = initializeFirestore(app, {});
        export const functions = getFunctions(app);
        export const storage = getStorage(app);
        export const analytics = initializeAnalytics(app);
      
        ${backendSource}
        `
      : ""
  }
  
  ${routeEnumSource}
  `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateFirebaseRcSource(firedeckConfig: FiredeckConfig, clients: ClientModule[]) {
  const projectsConfig = Object.keys(firedeckConfig.firebase?.projects ?? {}).reduce(
    (map, alias) => ({ ...map, [alias]: firedeckConfig.firebase!.projects[alias].projectId }),
    {} as Record<string, string>,
  );

  const targetsConfig = Object.keys(firedeckConfig.firebase?.projects ?? {}).reduce(
    (map, alias) => {
      const firebaseProject = firedeckConfig.firebase!.projects[alias];

      return {
        ...map,
        [firebaseProject.projectId]: {
          hosting: clients.reduce(
            (map, client) => {
              const clientHostingTarget = firebaseProject.hosting[client.name];
              return { ...map, [client.name]: [clientHostingTarget.siteId] };
            },
            {} as Record<string, string[]>,
          ),
        },
      };
    },
    {} as Record<string, Record<string, Record<string, string[]>>>,
  );

  const finalSource = JSON.stringify(
    {
      projects: projectsConfig,
      targets: targetsConfig,
    },
    null,
    2,
  );

  return format(finalSource, getPrettierConfig({ filePath: "a.json" }));
}

async function generateFirebaseJsonSource(
  clients: ClientModule[],
  backends: BackendModule[],
  runtimeDir: string,
  getRuntimeClientDistDir: (clientName: string) => string,
  getRuntimeBackendDir: (clientName: string) => string,
) {
  const hostingConfig =
    clients.length > 0
      ? clients.map((client) => {
          return {
            target: client.name,
            public: relative(runtimeDir, getRuntimeClientDistDir(client.name)),
            rewrites: [{ source: "**", destination: "/index.html" }],
          };
        })
      : undefined;

  const functionsConfig =
    backends.length > 0
      ? backends.map((backend) => {
          return {
            source: relative(runtimeDir, getRuntimeBackendDir(backend.name)),
            codebase: backend.name,
            ignore: [
              "src",
              "node_modules",
              ".env.sample",
              "rollup.config.mjs",
              "tsconfig.json",
              "*.log",
            ],
          };
        })
      : undefined;

  const firestoreConfig =
    backends.length > 0 ? { rules: "firestore.rules", indexes: "firestore.json" } : undefined;

  const storageConfig = backends.length > 0 ? { rules: "storage.rules" } : undefined;

  const emulatorsConfig = {
    auth: backends.length > 0 ? { port: 9099 } : undefined,
    functions: backends.length > 0 ? { port: 5001 } : undefined,
    firestore: backends.length > 0 ? { port: 8080 } : undefined,
    hosting: clients.length > 0 ? { port: 5000 } : undefined,
    storage: backends.length > 0 ? { port: 9199 } : undefined,
    pubsub: backends.length > 0 ? { port: 8085 } : undefined,
    ui: { enabled: true },
    singleProjectMode: true,
  };

  const finalSource = JSON.stringify(
    {
      hosting: hostingConfig,
      functions: functionsConfig,
      firestore: firestoreConfig,
      storage: storageConfig,
      emulators: emulatorsConfig,
    },
    null,
    2,
  );

  return format(finalSource, getPrettierConfig({ filePath: "a.json" }));
}

function generateFirebaseFirestoreJsonSource(
  firedeckConfig: FiredeckConfig,
  firebaseProjectAlias: string,
) {
  const firebaseProject = firedeckConfig.firebase?.projects[firebaseProjectAlias];
  if (!firebaseProject) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

  const finalSource = JSON.stringify(
    { indexes: firebaseProject.firestore?.indexes ?? [] },
    null,
    2,
  );

  return format(finalSource, getPrettierConfig({ filePath: "a.json" }));
}

function generateFirebaseFirestoreRulesSource(
  firedeckConfig: FiredeckConfig,
  firebaseProjectAlias: string,
) {
  const firebaseProject = firedeckConfig.firebase?.projects[firebaseProjectAlias];
  if (!firebaseProject) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

  return firebaseProject.firestore?.rules ?? "";
}

function generateFirebaseStorageRulesSource(
  firedeckConfig: FiredeckConfig,
  firebaseProjectAlias: string,
) {
  const firebaseProject = firedeckConfig.firebase?.projects[firebaseProjectAlias];
  if (!firebaseProject) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

  return firebaseProject.storage?.rules ?? "";
}

function flattenRoutes(route: ClientModuleRoute): ClientModuleRoute[] {
  return [
    { ...route, children: [] },
    ...route.children.reduce((flats, childRoute) => {
      return [...flats, ...flattenRoutes(childRoute)];
    }, [] as ClientModuleRoute[]),
  ];
}
