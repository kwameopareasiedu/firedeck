import fs from "fs-extra";
import { ProjectClient, ProjectMutation, ProjectRoute, RouterRoute } from "@/types";
import {
  assertFiredeckRootDir,
  getPrettierConfig,
  getProjectPaths,
  NOT_FOUND_URL_PATH,
  writeFileTree,
} from "@/utils";
import { parseFiredeckConfig } from "@/analyze-project";
import { generateRuntimeClientFileTree, generateRuntimeFileTree } from "@/templates";
import { resolve } from "node:path";
import { format } from "prettier";
import { snakeCase, startCase } from "lodash";

export async function applyProjectMutations(rootDir: string, mutations: ProjectMutation[]) {
  assertFiredeckRootDir(rootDir);

  const firedeckConfig = await parseFiredeckConfig(rootDir);
  const { modulesDir, runtimeDir, runtimeModulesDir, clientSdkDir } = getProjectPaths(rootDir);

  for (const mutation of mutations) {
    switch (mutation.type) {
      case "create-runtime": {
        fs.removeSync(runtimeDir);
        fs.ensureDirSync(runtimeDir);

        const runtimeFileTree = generateRuntimeFileTree({
          packageManagerName: firedeckConfig.packageManager.name,
          packageManagerVersion: firedeckConfig.packageManager.version,
        });
        await writeFileTree(runtimeDir, runtimeFileTree);
        break;
      }
      case "update-config": {
        // TODO: Generate config files
        break;
      }
      case "add-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mutation.clientName);
        const clientFileTree = generateRuntimeClientFileTree({ clientName: mutation.clientName });
        await writeFileTree(clientRoot, clientFileTree);
        break;
      }
      case "remove-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mutation.clientName);
        fs.removeSync(clientRoot);
        break;
      }
      case "rename-runtime-client": {
        const oldClientRoot = resolve(runtimeModulesDir, mutation.oldClientName);
        const newClientRoot = resolve(runtimeModulesDir, mutation.newClientName);
        fs.renameSync(oldClientRoot, newClientRoot);
        break;
      }
      case "update-runtime-client-routes": {
        const { clientName, clientRoutes } = mutation;
        const clientRouterFile = resolve(runtimeModulesDir, clientName, "src/router.tsx");
        const runtimeClientRouterSource = await generateClientRouterSource(clientRoutes);
        fs.writeFileSync(clientRouterFile, runtimeClientRouterSource);
        break;
      }
      case "update-runtime-client-html": {
        const htmlSrc = resolve(modulesDir, mutation.clientName, "client/index.html");
        const htmlDest = resolve(runtimeModulesDir, mutation.clientName, "index.html");

        if (fs.existsSync(htmlSrc)) fs.copyFileSync(htmlSrc, htmlDest);
        break;
      }
      case "update-runtime-client-env": {
        const envSrc = resolve(modulesDir, mutation.clientName, "client/.env");
        const envDest = resolve(runtimeModulesDir, mutation.clientName, ".env");

        if (fs.existsSync(envSrc)) fs.copyFileSync(envSrc, envDest);
        break;
      }
      case "update-client-sdk-routes": {
        const sdkRoutesFile = resolve(clientSdkDir, "routes.ts");
        const routesSource = await generateClientSdkRoutesSource(mutation.clients);
        fs.ensureFileSync(sdkRoutesFile);
        fs.writeFileSync(sdkRoutesFile, routesSource);
        break;
      }
    }
  }
}

async function generateClientRouterSource(routes: ProjectRoute) {
  function createReplaceTarget(str: string) {
    return `$$${str}$$`;
  }

  function generateReactRouterRoute(route: ProjectRoute): RouterRoute {
    const elementName = route.pageName
      ? route.pageName
      : route.layoutName
        ? route.layoutName
        : undefined;

    return {
      id: elementName,
      path: route.pageImportPath ? route.urlPath : undefined,
      element: elementName
        ? createReplaceTarget(
            route.pageName && route.placeholderName
              ? `withSuspense(<${route.pageName} />, <${route.placeholderName} />)`
              : route.pageName && !route.placeholderName
                ? `withSuspense(<${route.pageName} />)`
                : `<${route.layoutName} />`,
          )
        : undefined,
      loader: route.guardName ? createReplaceTarget(route.guardName) : undefined,
      children:
        route.children.length > 0 ? route.children.map(generateReactRouterRoute) : undefined,
    };
  }

  const routeImportSource = flattenRoutes(routes).reduce((importSrc, route) => {
    const imports = [];

    if (route.pageImportPath)
      imports.push(`const ${route.pageName} = lazy(() => import("${route.pageImportPath}"));`);

    if (route.layoutImportPath)
      imports.push(`import ${route.layoutName} from "${route.layoutImportPath}";`);

    if (route.placeholderImportPath)
      imports.push(`import ${route.placeholderName} from "${route.placeholderImportPath}";`);

    if (route.guardImportPath)
      imports.push(`import ${route.guardName} from "${route.guardImportPath}";`);

    return imports.length === 0 ? importSrc : importSrc + imports.join("\n") + "\n";
  }, "");

  const routeDeclarationSource = JSON.stringify(generateReactRouterRoute(routes)).replace(
    /"?\$\$"?/gm,
    "",
  );

  const routerSource = `
      import { type ReactNode, lazy, Suspense } from "react";
      import { createBrowserRouter } from "react-router";
      
      ${routeImportSource};
  
      function withSuspense(child: ReactNode, placeholder?: ReactNode) {
        return (
          <Suspense
            fallback={
              <div className="w-screen h-full grid place-items-center">
                {placeholder ?? <p>Please wait</p>}
              </div>
            }>
            {child}
          </Suspense>
        );
      }
      
      export default createBrowserRouter([${routeDeclarationSource}]);
    `;

  return format(routerSource, getPrettierConfig({ filePath: "a.tsx" }));
}

async function generateClientSdkRoutesSource(clients: ProjectClient[]) {
  const routerSource = clients.reduce((source, client) => {
    const routeEnumSource = flattenRoutes(client.routes).reduce((source, route) => {
      if (!route.pageName || !route.urlPath || route.urlPath === NOT_FOUND_URL_PATH) return source;

      return source + `${snakeCase(route.pageName).toUpperCase()} = "${route.urlPath}",\n`;
    }, "");

    const clientSource = `
      export enum ${startCase(client.name).replaceAll(" ", "")}Route { 
        ${routeEnumSource} 
      };\n`;

    return source + clientSource + "\n";
  }, "");

  const finalSource = `
    /**
     * ------------------------------------
     * This file was generated by Firedeck.
     *
     * Do not edit this file directly.
     * Your changes will be overwritten.
     * ------------------------------------
     */
     
     ${routerSource}
    `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function flattenRoutes(route: ProjectRoute): ProjectRoute[] {
  return [
    { ...route, children: [] },
    ...route.children.reduce((flats, childRoute) => {
      return [...flats, ...flattenRoutes(childRoute)];
    }, [] as ProjectRoute[]),
  ];
}
