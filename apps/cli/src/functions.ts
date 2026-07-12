import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";
import {
  generateModuleFileTree,
  generateProjectFileTree,
  generateRuntimeClientFileTree,
  generateRuntimeFileTree,
} from "@/templates";
import { generateStringHash, getPrettierConfig, pathIsFiredeckRoot, writeFileTree } from "@/utils";
import { ModuleComponents, RouteNode, RouteNodeTarget, Workspace, WorkspaceChange } from "@/types";
import { format } from "prettier";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
// @ts-expect-error declaration don't exist
import * as walkJsx from "acorn-jsx-walk";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import jsx from "acorn-jsx";

walkJsx.extend(walk.base);

export async function init(args: {
  rootDir: string;
  projectName: string;
  projectDescription: string;
  projectVersion: string;
  projectAuthor: string;
}) {
  if (!fs.existsSync(args.rootDir)) {
    fs.ensureDirSync(args.rootDir);
  } else if (fs.readdirSync(args.rootDir).length !== 0) {
    throw `./${relative(process.cwd(), args.rootDir)}: directory is not empty`;
  }

  const projectFileTree = generateProjectFileTree({
    projectName: args.projectName,
    projectDescription: args.projectDescription,
    projectVersion: args.projectVersion,
    projectAuthor: args.projectAuthor,
  });

  await writeFileTree(args.rootDir, projectFileTree);

  console.log("\nNext steps");
  console.log(`1. cd ${relative(process.cwd(), args.rootDir)}`);
  console.log(`2. npm install`);
  console.log(`3. npm run dev`);
}

export async function createModule(args: {
  rootDir: string;
  name: string;
  components?: ModuleComponents;
}) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  const modulesRoot = resolve(args.rootDir, `modules/${args.name}`);

  if (fs.existsSync(modulesRoot) && fs.readdirSync(modulesRoot).length !== 0)
    throw `${modulesRoot}: directory is not empty`;

  const components: ModuleComponents = args.components || "all";
  const moduleFileTree = generateModuleFileTree({ name: args.name, components: components });
  await writeFileTree(args.rootDir, moduleFileTree);

  console.log(`Created new module '${args.name}': ${modulesRoot}`);
}

export async function analyzeProject(args: { rootDir: string }) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  const modulesRoot = resolve(args.rootDir, "modules");
  const moduleNames = fs.readdirSync(modulesRoot, { encoding: "utf-8" }).filter((moduleName) => {
    return fs.lstatSync(resolve(modulesRoot, moduleName)).isDirectory() && moduleName !== "shared";
  });

  const workspace: Workspace = {
    clients: [],
  };

  for (const moduleName of moduleNames) {
    const moduleRoot = resolve(modulesRoot, moduleName);
    const clientRoot = resolve(moduleRoot, "client");

    if (fs.existsSync(clientRoot)) {
      const pagesRoot = resolve(clientRoot, "pages");
      if (!fs.existsSync(pagesRoot)) throw `${moduleName}/client/pages directory not found`;

      function discoverRoutes(dir: string): RouteNode {
        const relativeDir = relative(args.rootDir, dir);

        const dirContentPaths = fs
          .readdirSync(dir, { encoding: "utf-8" })
          .map((itemName) => resolve(dir, itemName));

        const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

        const pageFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("page.tsx"),
        );
        if (pageFilePaths.length > 1) throw `${relativeDir} contains multiple page files`;
        if (!dirIsRoutable && pageFilePaths.length > 0)
          throw `${relativeDir} is not routable but contains a page file: ${pageFilePaths[0]}`;

        const pageImportPath =
          dirIsRoutable && pageFilePaths.length > 0
            ? `@/${relative(modulesRoot, pageFilePaths[0])}`
            : null;

        const layoutFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("layout.tsx"),
        );
        if (layoutFilePaths.length > 1) throw `${relativeDir} contains multiple layout files`;

        const layoutImportPath =
          layoutFilePaths.length > 0 ? `@/${relative(modulesRoot, layoutFilePaths[0])}` : null;

        const placeholderFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("placeholder.tsx"),
        );
        if (placeholderFilePaths.length > 1)
          throw `${relativeDir} contains multiple placeholder files`;

        const placeholderImportPath =
          placeholderFilePaths.length > 0
            ? `@/${relative(modulesRoot, placeholderFilePaths[0])}`
            : null;

        const guardFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("guard.ts"),
        );
        if (guardFilePaths.length > 1) throw `${relativeDir} contains multiple guard files`;

        const guardImportPath =
          guardFilePaths.length > 0 ? `@/${relative(modulesRoot, guardFilePaths[0])}` : null;

        const urlPath = pageImportPath
          ? "/" +
            relative(pagesRoot, dir)
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
          const pageFilePath = pageFilePaths[0];
          const fallbackName =
            (relative(pagesRoot, dir) || "__root")
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

        const subDirectories = dirContentPaths.filter((itemPath) =>
          fs.lstatSync(itemPath).isDirectory(),
        );

        return {
          name: routeName,
          pageImportPath: pageImportPath,
          layoutImportPath: layoutImportPath,
          placeholderImportPath: placeholderImportPath,
          guardImportPath: guardImportPath,
          urlPath: urlPath,
          children: subDirectories.map((subDir) => {
            return discoverRoutes(subDir);
          }),
        };
      }

      const routeNode = discoverRoutes(pagesRoot);

      const htmlPath = resolve(clientRoot, "index.html");
      if (!fs.existsSync(htmlPath)) throw `${moduleName}/client/index.html not found`;

      const htmlContent = fs.readFileSync(htmlPath, { encoding: "utf-8" });

      const workspaceClient: Workspace["clients"][number] = {
        name: moduleName,
        routes: routeNode,
        html: { hash: generateStringHash(htmlContent) },
      };

      workspace.clients.push(workspaceClient);
    }

    // const serverRoot = resolve(moduleRoot, "server");
  }

  return workspace;
}

export function compareWorkspaces(w1: Workspace | null, w2: Workspace) {
  const changes: WorkspaceChange[] = [];

  if (!w1) {
    changes.push({ type: "create-runtime" });

    w1 = { clients: [] };
  }

  for (let cIdx = 0; cIdx < Math.max(w1.clients.length, w2.clients.length); cIdx++) {
    const w1c = w1.clients[cIdx];
    const w2c = w2.clients[cIdx];

    if (!w1c && w2c) {
      changes.push(
        {
          type: "add-client",
          clientName: w2c.name,
        },
        {
          type: "update-client-routes",
          clientName: w2c.name,
          clientRoutes: w2c.routes,
        },
        {
          type: "update-client-html",
          clientName: w2c.name,
        },
      );
    } else if (w1c && !w2c) {
      changes.push({
        type: "remove-client",
        clientName: w1c.name,
      });
    } else if (w1c && w2c) {
      if (w1c.name !== w2c.name) {
        changes.push({
          type: "rename-client",
          oldClientName: w1c.name,
          newClientName: w2c.name,
        });
      }

      if (JSON.stringify(w1c.routes) !== JSON.stringify(w2c.routes)) {
        changes.push({
          type: "update-client-routes",
          clientName: w2c.name,
          clientRoutes: w2c.routes,
        });
      }

      if (w1c.html.hash !== w2c.html.hash) {
        changes.push({
          type: "update-client-html",
          clientName: w2c.name,
        });
      }
    }
  }

  return changes;
}

export async function createRouterSource(routes: RouteNode) {
  function flattenRoutes(route: RouteNode): RouteNode[] {
    return [
      { ...route, children: [] },
      ...route.children.reduce((flats, childRoute) => {
        return [...flats, ...flattenRoutes(childRoute)];
      }, [] as RouteNode[]),
    ];
  }

  const flattenedRoutes = flattenRoutes(routes);

  function createReplaceTarget(str: string) {
    return `$$${str}$$`;
  }

  function transformRoute(route: RouteNode): RouteNodeTarget {
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
      children: route.children.length > 0 ? route.children.map(transformRoute) : undefined,
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

  const routeTargetSource = JSON.stringify(transformRoute(routes), null, 2).replace(
    /"?\$\$"?/gm,
    "",
  );

  const routerSource = `
    import { type ReactNode, lazy, Suspense } from "react";
    import { createBrowserRouter } from "react-router";
    
    ${flattenedRoutes.reduce((importSrc, route) => {
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
    }, "")};

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
    
    export default createBrowserRouter([
      ${routeTargetSource}
    ]);
  `;

  return format(routerSource, getPrettierConfig({ filePath: "a.tsx" }));
}

export async function applyWorkspaceChanges(args: { rootDir: string; changes: WorkspaceChange[] }) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  const runtimeRoot = resolve(args.rootDir, ".firedeck/runtime");
  const runtimeModulesRoot = resolve(args.rootDir, ".firedeck/runtime/modules");

  for (const change of args.changes) {
    console.log("CHANGE:", change);

    switch (change.type) {
      case "create-runtime": {
        fs.removeSync(runtimeRoot);
        fs.ensureDirSync(runtimeRoot);

        const runtimeFileTree = generateRuntimeFileTree();
        await writeFileTree(runtimeRoot, runtimeFileTree);
        break;
      }
      case "add-client": {
        const runtimeClientRoot = resolve(runtimeModulesRoot, change.clientName);
        const runtimeClientFileTree = generateRuntimeClientFileTree({
          clientName: change.clientName,
        });
        await writeFileTree(runtimeClientRoot, runtimeClientFileTree);
        break;
      }
      case "remove-client": {
        const runtimeClientRoot = resolve(runtimeModulesRoot, change.clientName);
        fs.removeSync(runtimeClientRoot);
        break;
      }
      case "rename-client": {
        const oldRuntimeClientRoot = resolve(runtimeModulesRoot, change.oldClientName);
        const newRuntimeClientRoot = resolve(runtimeModulesRoot, change.newClientName);
        fs.renameSync(oldRuntimeClientRoot, newRuntimeClientRoot);
        break;
      }
      case "update-client-routes": {
        const runtimeClientSrcRoot = resolve(runtimeModulesRoot, change.clientName, "src");
        const routerFilePath = resolve(runtimeClientSrcRoot, "router.tsx");
        fs.writeFileSync(routerFilePath, await createRouterSource(change.clientRoutes));
        break;
      }
      case "update-client-html": {
        const { clientName } = change;
        const htmlSrcPath = resolve(args.rootDir, "modules", clientName, "client", "index.html");
        const htmlDestPath = resolve(runtimeModulesRoot, change.clientName, "index.html");

        if (fs.existsSync(htmlSrcPath)) {
          fs.copyFileSync(htmlSrcPath, htmlDestPath);
        } else console.warn(`${relative(args.rootDir, htmlSrcPath)}: index.html not found`);
        break;
      }
    }
  }
}

export async function compile(args: { rootDir: string }) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  const runtimeRoot = resolve(args.rootDir, ".firedeck/runtime");
  fs.removeSync(runtimeRoot);

  const newWorkspace = await analyzeProject({ rootDir: args.rootDir });
  const nullWorkspaceChanges = compareWorkspaces(null, newWorkspace);
  await applyWorkspaceChanges({ rootDir: args.rootDir, changes: nullWorkspaceChanges });
}
