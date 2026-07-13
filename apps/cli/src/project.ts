import { generateStringHash, getPrettierConfig, pathIsFiredeckRoot, writeFileTree } from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import {
  generateClientSdkFileTree,
  generateModuleFileTree,
  generateProjectFileTree,
  generateRuntimeClientFileTree,
  generateRuntimeFileTree,
} from "@/templates";
import { ModuleComponents } from "@/types";
import * as acorn from "acorn";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import jsx from "acorn-jsx";
import * as walk from "acorn-walk";
// @ts-expect-error declaration don't exist
import * as walkJsx from "acorn-jsx-walk";
import { ClientRoute, ReactRouterRoute, Runtime, RuntimeChange, RuntimeClient } from "@/runtime";
import { format } from "prettier";

walkJsx.extend(walk.base);

export class Project {
  private readonly rootDir: string;
  private readonly modulesDir: string;
  private readonly runtimeDir: string;
  private readonly runtimeModulesDir: string;
  private readonly clientSdkDir: string;

  constructor(args: { rootDir: string }) {
    this.rootDir = args.rootDir;
    this.modulesDir = resolve(args.rootDir, "modules");
    this.runtimeDir = resolve(args.rootDir, ".firedeck/runtime");
    this.runtimeModulesDir = resolve(args.rootDir, ".firedeck/runtime/modules");
    this.clientSdkDir = resolve(args.rootDir, "node_modules/@firedeck/client-sdk");
  }

  async init(args: {
    projectName: string;
    projectDescription: string;
    projectVersion: string;
    projectAuthor: string;
  }) {
    if (!fs.existsSync(this.rootDir)) {
      fs.ensureDirSync(this.rootDir);
    } else if (fs.readdirSync(this.rootDir).length !== 0) {
      throw `./${relative(process.cwd(), this.rootDir)}: directory is not empty`;
    }

    const projectFileTree = generateProjectFileTree({
      projectName: args.projectName,
      projectDescription: args.projectDescription,
      projectVersion: args.projectVersion,
      projectAuthor: args.projectAuthor,
    });

    await writeFileTree(this.rootDir, projectFileTree);
  }

  async createModule(args: { moduleName: string; components?: ModuleComponents }) {
    this.assertFiredeckRootDir();

    const moduleDir = resolve(this.modulesDir, args.moduleName);

    if (fs.existsSync(moduleDir) && fs.readdirSync(moduleDir).length !== 0)
      throw `${moduleDir}: directory is not empty`;

    const components: ModuleComponents = args.components || "all";
    const moduleFileTree = generateModuleFileTree({
      name: args.moduleName,
      components: components,
    });
    await writeFileTree(this.rootDir, moduleFileTree);

    return moduleDir;
  }

  async analyze() {
    this.assertFiredeckRootDir();

    const moduleNames = fs
      .readdirSync(this.modulesDir, { encoding: "utf-8" })
      .filter((moduleName) => {
        return (
          fs.lstatSync(resolve(this.modulesDir, moduleName)).isDirectory() &&
          moduleName !== "shared"
        );
      });

    const runtimeClients: RuntimeClient[] = [];

    for (const moduleName of moduleNames) {
      const clientDir = resolve(this.modulesDir, moduleName, "client");

      if (fs.existsSync(clientDir)) {
        const pagesDir = resolve(clientDir, "pages");
        if (!fs.existsSync(pagesDir))
          throw `${relative(this.rootDir, pagesDir)} directory not found`;

        const clientRoutes = this.discoverRoutes(pagesDir, pagesDir);

        const htmlPath = resolve(clientDir, "index.html");
        if (!fs.existsSync(htmlPath)) throw `${moduleName}/client/index.html not found`;

        const htmlContent = fs.readFileSync(htmlPath, { encoding: "utf-8" });

        runtimeClients.push({
          name: moduleName,
          routes: clientRoutes,
          htmlHash: generateStringHash(htmlContent),
        });
      }

      // const serverRoot = resolve(moduleRoot, "server");
    }

    return new Runtime({ clients: runtimeClients });
  }

  async updateRuntime(changes: RuntimeChange[]) {
    this.assertFiredeckRootDir();

    for (const change of changes) {
      switch (change.type) {
        case "create-runtime": {
          fs.removeSync(this.runtimeDir);
          fs.ensureDirSync(this.runtimeDir);

          const runtimeFileTree = generateRuntimeFileTree();
          await writeFileTree(this.runtimeDir, runtimeFileTree);
          break;
        }
        case "update-client-sdk": {
          const clientSdkTree = generateClientSdkFileTree();
          await writeFileTree(this.clientSdkDir, clientSdkTree);
          break;
        }
        case "add-client": {
          const clientRoot = resolve(this.runtimeModulesDir, change.clientName);
          const clientFileTree = generateRuntimeClientFileTree({ clientName: change.clientName });
          await writeFileTree(clientRoot, clientFileTree);
          break;
        }
        case "remove-client": {
          const clientRoot = resolve(this.runtimeModulesDir, change.clientName);
          fs.removeSync(clientRoot);
          break;
        }
        case "rename-client": {
          const oldClientRoot = resolve(this.runtimeModulesDir, change.oldClientName);
          const newClientRoot = resolve(this.runtimeModulesDir, change.newClientName);
          fs.renameSync(oldClientRoot, newClientRoot);
          break;
        }
        case "update-client-routes": {
          const clientSrcRoot = resolve(this.runtimeModulesDir, change.clientName, "src");
          const clientRouterFile = resolve(clientSrcRoot, "router.tsx");
          fs.writeFileSync(clientRouterFile, await this.createRouterSource(change.clientRoutes));
          break;
        }
        case "update-client-html": {
          const htmlSrc = resolve(this.modulesDir, change.clientName, "client/index.html");
          const htmlDest = resolve(this.runtimeModulesDir, change.clientName, "index.html");

          if (fs.existsSync(htmlSrc)) {
            fs.copyFileSync(htmlSrc, htmlDest);
          } else console.warn(`${relative(this.rootDir, htmlSrc)}: index.html not found`);
          break;
        }
      }
    }
  }

  private assertFiredeckRootDir() {
    if (!pathIsFiredeckRoot(this.rootDir))
      throw `${this.rootDir}: directory is not a valid firedeck project`;
  }

  private discoverRoutes(dir: string, pagesDir: string): ClientRoute {
    const relativeDir = relative(this.rootDir, dir);
    const dirContents = fs
      .readdirSync(dir, { encoding: "utf-8" })
      .map((name) => resolve(dir, name));
    const dirDirs = dirContents.filter((item) => fs.lstatSync(item).isDirectory());
    const dirFiles = dirContents.filter((item) => fs.lstatSync(item).isFile());
    const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

    const pageFiles = dirFiles.filter((itemPath) => itemPath.endsWith("page.tsx"));
    if (dirIsRoutable) {
      if (pageFiles.length === 0) throw `${relativeDir} contains no page files`;
      else if (pageFiles.length > 1) throw `${relativeDir} contains multiple page files`;
    } else if (pageFiles.length > 0) {
      throw `${relativeDir} is not routable but contains a page file: ${pageFiles[0]}`;
    }

    const pageImportPath =
      dirIsRoutable && pageFiles.length > 0 ? `@/${relative(this.modulesDir, pageFiles[0])}` : null;

    const layoutFiles = dirFiles.filter((itemPath) => itemPath.endsWith("layout.tsx"));
    if (layoutFiles.length > 1) throw `${relativeDir} contains multiple layout files`;

    const layoutImportPath =
      layoutFiles.length > 0 ? `@/${relative(this.modulesDir, layoutFiles[0])}` : null;

    const placeholderFiles = dirFiles.filter((itemPath) => itemPath.endsWith("placeholder.tsx"));
    if (placeholderFiles.length > 1) throw `${relativeDir} contains multiple placeholder files`;

    const placeholderImportPath =
      placeholderFiles.length > 0 ? `@/${relative(this.modulesDir, placeholderFiles[0])}` : null;

    const guardFiles = dirFiles.filter((itemPath) => itemPath.endsWith("guard.ts"));
    if (guardFiles.length > 1) throw `${relativeDir} contains multiple guard files`;

    const guardImportPath =
      guardFiles.length > 0 ? `@/${relative(this.modulesDir, guardFiles[0])}` : null;

    const urlPath = dirIsRoutable
      ? "/" +
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
      : null;

    const routeName = (() => {
      const pageFilePath = pageFiles[0];
      const fallbackName =
        (relative(pagesDir, dir) || "__root")
          .split(sep)
          .map((seg) => {
            const nonSymbolMatches = /(\w+)/.exec(seg);
            const $seg = nonSymbolMatches?.[1] || seg;
            return $seg[0].toUpperCase() + $seg.slice(1);
          })
          .join("") + "Group";

      if (!pageFilePath) return fallbackName;

      const parser = acorn.Parser.extend(tsPlugin(), jsx());
      const pageFileSource = fs.readFileSync(pageFilePath, { encoding: "utf-8" });
      const ast = parser.parse(pageFileSource, { ecmaVersion: "latest", sourceType: "module" });
      let routeName = fallbackName;

      walk.simple(ast, {
        ExportDefaultDeclaration: (node) => {
          if (node.declaration.type === "FunctionDeclaration") {
            routeName = (node.declaration as acorn.FunctionDeclaration).id?.name;
          } else if (node.declaration.type === "Identifier") {
            routeName = (node.declaration as acorn.Identifier).name;
          }
        },
      });

      return routeName;
    })();

    return {
      name: routeName,
      pageImportPath: pageImportPath,
      layoutImportPath: layoutImportPath,
      placeholderImportPath: placeholderImportPath,
      guardImportPath: guardImportPath,
      urlPath: urlPath,
      children: dirDirs.map((childDir) => {
        return this.discoverRoutes(childDir, pagesDir);
      }),
    };
  }

  private async createRouterSource(routes: ClientRoute) {
    function flattenRoutes(route: ClientRoute): ClientRoute[] {
      return [
        { ...route, children: [] },
        ...route.children.reduce((flats, childRoute) => {
          return [...flats, ...flattenRoutes(childRoute)];
        }, [] as ClientRoute[]),
      ];
    }

    function createReplaceTarget(str: string) {
      return `$$${str}$$`;
    }

    function transformClientRouteToReactRouterRoute(route: ClientRoute): ReactRouterRoute {
      const pageName = route.name;
      const layoutName = route.name + "Layout";
      const placeholderName = route.name + "Placeholder";
      const guardName = route.name.toLowerCase() + "Guard";

      const pageTarget = {
        id: route.name,
        path: route.pageImportPath ? route.urlPath : undefined,
        element: route.pageImportPath
          ? createReplaceTarget(
              route.placeholderImportPath
                ? `withSuspense(<${pageName} />, <${placeholderName} />)`
                : `withSuspense(<${pageName} />)`,
            )
          : undefined,
        loader: route.guardImportPath ? createReplaceTarget(guardName) : undefined,
        children:
          route.children.length > 0
            ? route.children.map(transformClientRouteToReactRouterRoute)
            : undefined,
      };

      if (route.layoutImportPath) {
        return {
          id: route.name,
          element: createReplaceTarget(`<${layoutName} />`),
          children: [pageTarget],
        };
      }

      return pageTarget;
    }

    const routeImportSource = flattenRoutes(routes).reduce((importSrc, route) => {
      const routeImports = [];
      const pageName = route.name;
      const layoutName = route.name + "Layout";
      const placeholderName = route.name + "Placeholder";
      const guardName = route.name.toLowerCase() + "Guard";

      if (route.pageImportPath)
        routeImports.push(`const ${pageName} = lazy(() => import("${route.pageImportPath}"));`);

      if (route.layoutImportPath)
        routeImports.push(`import ${layoutName} from "${route.layoutImportPath}";`);

      if (route.placeholderImportPath)
        routeImports.push(`import ${placeholderName} from "${route.placeholderImportPath}";`);

      if (route.guardImportPath)
        routeImports.push(`import ${guardName} from "${route.guardImportPath}";`);

      return routeImports.length === 0 ? importSrc : importSrc + routeImports.join("\n") + "\n";
    }, "");

    const reactRouterSource = JSON.stringify(
      transformClientRouteToReactRouterRoute(routes),
    ).replace(/"?\$\$"?/gm, "");

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
      
      export default createBrowserRouter([${reactRouterSource}]);
    `;

    return format(routerSource, getPrettierConfig({ filePath: "a.tsx" }));
  }
}
