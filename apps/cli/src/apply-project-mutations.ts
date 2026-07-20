import fs from "fs-extra";
import {
  BackendModule,
  BackendModuleFunction,
  ClientModule,
  ClientModuleRoute,
  FileTree,
  ProjectMutation,
  RouterRoute,
} from "@/types";
import {
  assertFiredeckRootDir,
  demoFirebaseProject,
  getPrettierConfig,
  getProjectPaths,
  NOT_FOUND_URL_PATH,
  pascalCase,
  screamingSnakeCase,
  writeFileTree,
} from "@/utils";
import { relative, resolve } from "node:path";
import { format } from "prettier";
import { FiredeckConfig } from "shared/firedeck-config";

/** Applies a list of `ProjectMutation` items to the project file system */
export async function applyProjectMutations(
  rootDir: string,
  mutations: ProjectMutation[],
  opts?: { firebaseProjectAlias?: string },
) {
  assertFiredeckRootDir(rootDir);

  const {
    getClientModulePublicDir,
    clientSdkRoutesFile,
    getClientSdkClientModuleApiFile,
    runtimeDir,
    runtimeModulesDir,
    runtimeFirebaseRcFile,
    runtimeFirebaseJsonFile,
    workspaceEnvTypesFile,
    workspaceConfigFile,
    workspaceConfigTypesFile,
  } = getProjectPaths(rootDir);

  for (const mut of mutations) {
    switch (mut.type) {
      case "update-workspace-env-types": {
        const envTypesSource = await generateWorkspaceEnvTypesSource(mut.clients);
        fs.writeFileSync(workspaceEnvTypesFile, envTypesSource);

        break;
      }
      case "update-runtime-clients-config": {
        for (const client of mut.clients) {
          const configDestPath = resolve(runtimeModulesDir, client.name, "firedeck.config.mjs");
          const typesDestPath = resolve(runtimeModulesDir, client.name, "firedeck.config.d.mts");
          fs.copyFileSync(workspaceConfigFile, configDestPath);
          fs.copyFileSync(workspaceConfigTypesFile, typesDestPath);
        }

        break;
      }
      case "create-runtime": {
        fs.removeSync(runtimeDir);
        fs.ensureDirSync(runtimeDir);

        const runtimeFileTree = generateRuntimeFileTree(
          mut.config.packageManager.name,
          mut.config.packageManager.version,
        );
        await writeFileTree(runtimeDir, runtimeFileTree);
        break;
      }
      case "update-runtime-firebase-config": {
        const firebaseRcSource = await generateFirebaseRcSource(mut.config, mut.clients);
        fs.writeFileSync(runtimeFirebaseRcFile, firebaseRcSource);

        const firebaseJsonSource = await generateFirebaseJsonSource(
          mut.clients,
          mut.backends,
          runtimeDir,
          runtimeModulesDir,
        );
        fs.writeFileSync(runtimeFirebaseJsonFile, firebaseJsonSource);

        break;
      }
      case "add-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mut.clientName);
        const clientFileTree = generateRuntimeClientFileTree(mut.clientName);
        await writeFileTree(clientRoot, clientFileTree);
        break;
      }
      case "rename-runtime-client": {
        const oldClientRoot = resolve(runtimeModulesDir, mut.oldClientName);
        const newClientRoot = resolve(runtimeModulesDir, mut.newClientName);
        fs.renameSync(oldClientRoot, newClientRoot);
        break;
      }
      case "update-runtime-client-routes": {
        const clientRoutesFile = resolve(runtimeModulesDir, mut.clientName, "src/routes.ts");
        const runtimeClientRoutesSource = await generateRuntimeClientRoutesSource(mut.clientRoutes);
        fs.writeFileSync(clientRoutesFile, runtimeClientRoutesSource);
        break;
      }
      case "update-runtime-client-html": {
        const htmlDest = resolve(runtimeModulesDir, mut.clientName, "index.html");
        fs.writeFileSync(htmlDest, mut.html);
        break;
      }
      case "update-runtime-client-env": {
        const envDest = resolve(runtimeModulesDir, mut.clientName, ".env");
        fs.writeFileSync(envDest, mut.env);
        break;
      }
      case "update-runtime-client-public-dir": {
        const clientPublicDir = getClientModulePublicDir(mut.clientName);
        const clientRuntimePublicDir = resolve(runtimeModulesDir, mut.clientName, "public");
        fs.removeSync(clientRuntimePublicDir);
        fs.copySync(clientPublicDir, clientRuntimePublicDir);
        break;
      }
      case "remove-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mut.clientName);
        fs.removeSync(clientRoot);
        break;
      }
      case "add-runtime-backend": {
        const backendRoot = resolve(runtimeModulesDir, mut.backendName);
        const backendFileTree = generateRuntimeBackendFileTree(mut.backendName);
        await writeFileTree(backendRoot, backendFileTree);
        break;
      }
      case "rename-runtime-backend": {
        const oldBackendRoot = resolve(runtimeModulesDir, mut.oldBackendName);
        const newBackendRoot = resolve(runtimeModulesDir, mut.newBackendName);
        fs.renameSync(oldBackendRoot, newBackendRoot);
        break;
      }
      case "update-runtime-backend-functions": {
        const { backendName, backendFunctions } = mut;
        const backendFunctionsFile = resolve(runtimeModulesDir, backendName, "src/functions.ts");
        const runtimeBackendFunctionsSource =
          await generateRuntimeBackendFunctionsSource(backendFunctions);
        fs.writeFileSync(backendFunctionsFile, runtimeBackendFunctionsSource);
        break;
      }
      case "update-runtime-backend-env": {
        const envDest = resolve(runtimeModulesDir, mut.backendName, ".env");
        fs.writeFileSync(envDest, mut.env);
        break;
      }
      case "remove-runtime-backend": {
        const backendRoot = resolve(runtimeModulesDir, mut.backendName);
        fs.removeSync(backendRoot);
        break;
      }
      case "update-client-sdk-routes": {
        const routesSource = await generateClientSdkRoutesSource(mut.clients);
        fs.ensureFileSync(clientSdkRoutesFile);
        fs.writeFileSync(clientSdkRoutesFile, routesSource);
        break;
      }
      case "update-client-sdk-api":
        for (const client of mut.clients) {
          const clientModuleSdkApiFile = getClientSdkClientModuleApiFile(client.name);
          const clientModuleSdkApiSource = await generateClientSdkApiSource(
            mut.config,
            client,
            mut.backends,
            opts?.firebaseProjectAlias,
          );
          fs.ensureFileSync(clientModuleSdkApiFile);
          fs.writeFileSync(clientModuleSdkApiFile, clientModuleSdkApiSource);
        }
        break;
    }
  }
}

function generateWorkspaceEnvTypesSource(clients: ClientModule[]) {
  const allClientEnvs = clients
    .reduce((envs, client) => `${envs}${client.env}\n`, "")
    .split("\n")
    .filter((line) => !!line);

  const keySet = new Set<string>();

  const envLines = allClientEnvs.reduce((lines, line) => {
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

  const finalSource = `
    interface ViteTypeOptions {
      strictImportMetaEnv: unknown
    }

    interface ImportMetaEnv {
      ${envLines.join("\n")}
    }
    
    interface ImportMeta {
      readonly env: ImportMetaEnv;
    }
  `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateRuntimeFileTree(
  packageManagerName: string,
  packageManagerVersion: string,
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
          "dev": "../../node_modules/.bin/turbo dev emulate",
          "build": "../../node_modules/.bin/turbo build",
          "emulate": "../../node_modules/.bin/kill-port 4000 8080 8085 && firebase emulators:start --project demo-firedeck --import ../../temp/firebase/emulator --export-on-exit"
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
  };
}

function generateRuntimeClientFileTree(clientName: string): FileTree {
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
            "@/*": ["../../../../modules/*"],
          },
          "types": ["vite/client"]
        },
        "include": ["./src", "./global.d.ts", "../../../../modules"]
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
      import { connectAuthEmulator } from "firebase/auth";
      import { connectFunctionsEmulator } from "firebase/functions";
      import { connectFirestoreEmulator } from "firebase/firestore";
      import { connectStorageEmulator } from "firebase/storage";
      import { auth, firestore, functions, storage } from "@/sdk/client/${clientName}-api.ts";
      
      if (import.meta.env.MODE === "development") {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        connectFunctionsEmulator(functions, "localhost", 5001);
        connectFirestoreEmulator(firestore, "localhost", 8080);
        connectStorageEmulator(storage, "localhost", 9199);
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
        if (!warning.message.includes("allowImportingTsExtensions")) defaultHandler(warning);
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

function generateClientSdkRoutesSource(clients: ClientModule[]) {
  const routerSource = clients.reduce((source, client) => {
    const routeEnumSource = flattenRoutes(client.routes).reduce((source, route) => {
      if (!route.pageName || !route.urlPath || route.urlPath === NOT_FOUND_URL_PATH) return source;

      return source + `${screamingSnakeCase(route.pageName)} = "${route.urlPath}",\n`;
    }, "");

    const clientSource = `
      export enum ${pascalCase(client.name)}Route { 
        ${routeEnumSource} 
      };\n`;

    return source + clientSource + "\n";
  }, "");

  const finalSource = `
  /**
   * ------------------------------------------------
   * This file was generated by Firedeck. Do not edit
   * ------------------------------------------------
   */
   
   ${routerSource}`;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateClientSdkApiSource(
  firedeckConfig: FiredeckConfig,
  client: ClientModule,
  backends: BackendModule[],
  firebaseProjectAlias?: string,
) {
  const firebaseProjectConfigs = firedeckConfig.firebase?.projects ?? [];

  const firebaseProjectConfig = firebaseProjectAlias
    ? firebaseProjectConfigs.find((project) => project.projectAlias === firebaseProjectAlias)
    : demoFirebaseProject;

  if (!firebaseProjectConfig) throw `invalid firebase project alias: ${firebaseProjectAlias}`;

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
   
  import { initializeApp } from "firebase/app";
  import { browserSessionPersistence, initializeAuth } from "firebase/auth";
  import { initializeFirestore } from "firebase/firestore";
  import { getFunctions, httpsCallable } from "firebase/functions";
  import { getStorage } from "firebase/storage";
  import { initializeAnalytics } from "firebase/analytics";
  import type { CallableFunction } from "firebase-functions/https";
  
  type GetBackendFnArgs<T> = T extends CallableFunction<infer A, unknown> ? A : never;
  type GetBackendFnReturn<T> = T extends CallableFunction<unknown, infer R> ? R : never;
  
  const firebaseConfig = ${JSON.stringify(firebaseProjectConfig.apps({ moduleName: client.name }))};
  
  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const auth = initializeAuth(app, { persistence: browserSessionPersistence });
  export const firestore = initializeFirestore(app, {});
  export const functions = getFunctions(app);
  export const storage = getStorage(app);
  export const analytics = initializeAnalytics(app);

  ${backendSource}
  `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function generateFirebaseRcSource(firedeckConfig: FiredeckConfig, clients: ClientModule[]) {
  const firebaseProjectConfigs = firedeckConfig.firebase?.projects ?? [demoFirebaseProject];

  const projectConfig = firebaseProjectConfigs.reduce(
    (projectConfig, project) => ({ ...projectConfig, [project.projectAlias]: project.projectId }),
    {} as Record<string, string>,
  );

  const hostingTargetConfig = firebaseProjectConfigs.reduce(
    (targetConfig, project) => {
      const hostingTargetConfig = clients.reduce(
        (hostingTargetConfig, client) => ({
          ...hostingTargetConfig,
          [client.name]: [project.hosting({ moduleName: client.name }).siteId],
        }),
        {} as Record<string, string[]>,
      );

      return {
        ...targetConfig,
        [project.projectId]: { hosting: hostingTargetConfig },
      };
    },
    {} as Record<string, Record<string, Record<string, string[]>>>,
  );

  const finalSource = JSON.stringify(
    {
      project: projectConfig,
      targets: hostingTargetConfig,
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
  runtimeModulesDir: string,
) {
  const hostingConfig = clients.map((client) => {
    return {
      target: client.name,
      public: relative(runtimeDir, resolve(runtimeModulesDir, client.name, "dist")),
      rewrites: [{ source: "**", destination: "/index.html" }],
    };
  });

  const functionsConfig = backends.map((backend) => {
    return {
      source: relative(runtimeDir, resolve(runtimeModulesDir, backend.name)),
      codebase: backend.name,
      ignore: ["src", "node_modules", ".env.sample", "rollup.config.mjs", "tsconfig.json", "*.log"],
    };
  });

  const finalSource = JSON.stringify(
    {
      functions: functionsConfig,
      hosting: hostingConfig,
      emulators: {
        auth: { port: 9099 },
        functions: { port: 5001 },
        firestore: { port: 8080 },
        hosting: { port: 5000 },
        storage: { port: 9199 },
        pubsub: { port: 8085 },
        ui: { enabled: true },
        singleProjectMode: true,
      },
    },
    null,
    2,
  );

  return format(finalSource, getPrettierConfig({ filePath: "a.json" }));
}

function flattenRoutes(route: ClientModuleRoute): ClientModuleRoute[] {
  return [
    { ...route, children: [] },
    ...route.children.reduce((flats, childRoute) => {
      return [...flats, ...flattenRoutes(childRoute)];
    }, [] as ClientModuleRoute[]),
  ];
}
