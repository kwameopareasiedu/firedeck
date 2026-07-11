import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";
import {
  generateModuleHierarchy,
  generateProjectHierarchy,
  generateRuntimeClientHierarchy,
  generateRuntimeRootHierarchy,
} from "@/templates";
import { pathIsFiredeckRoot, writeOutputHierarchy } from "@/utils";
import { ModuleComponents, RouteNode, Workspace, WorkspaceChange } from "@/types";

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

  const projectHierarchy = generateProjectHierarchy({
    projectName: args.projectName,
    projectDescription: args.projectDescription,
    projectVersion: args.projectVersion,
    projectAuthor: args.projectAuthor,
  });

  await writeOutputHierarchy(args.rootDir, projectHierarchy);

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
  const moduleHierarchy = generateModuleHierarchy({ name: args.name, components: components });
  await writeOutputHierarchy(args.rootDir, moduleHierarchy);

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
        const dirContentPaths = fs
          .readdirSync(dir, { encoding: "utf-8" })
          .map((itemName) => resolve(dir, itemName));

        const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

        const pageFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("page.tsx"),
        );
        if (pageFilePaths.length > 1) throw `${dir} contains multiple page files`;
        if (!dirIsRoutable && pageFilePaths.length > 0)
          console.warn(`ignoring '${pageFilePaths[0]}' from routes since ${dir} is not routable`);

        const pageImportPath =
          dirIsRoutable && pageFilePaths.length > 0
            ? `@/${relative(modulesRoot, pageFilePaths[0])}.tsx`
            : null;

        const layoutFilePaths = dirContentPaths.filter(
          (itemPath) => fs.lstatSync(itemPath).isFile() && itemPath.endsWith("layout.tsx"),
        );
        if (layoutFilePaths.length > 1) throw `${dir} contains multiple layout files`;

        const layoutImportPath =
          layoutFilePaths.length > 0 ? `@/${relative(modulesRoot, layoutFilePaths[0])}.tsx` : null;

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

        const subDirectories = dirContentPaths.filter((itemPath) =>
          fs.lstatSync(itemPath).isDirectory(),
        );

        return {
          pageImportPath: pageImportPath,
          layoutImportPath: layoutImportPath,
          urlPath: urlPath,
          children: subDirectories.map((subDir) => {
            return discoverRoutes(subDir);
          }),
        };
      }

      const routeNode = discoverRoutes(pagesRoot);

      const workspaceClient: Workspace["clients"][number] = { name: moduleName, routes: routeNode };
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
      changes.push({
        type: "add-client",
        clientName: w2c.name,
      });
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
        changes.push({ type: "update-client-routes", clientName: w2c.name });
      }
    }
  }

  return changes;
}

export async function applyWorkspaceChanges(args: { rootDir: string; changes: WorkspaceChange[] }) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  for (const change of args.changes) {
    console.log("CHANGE:", change);

    switch (change.type) {
      case "create-runtime": {
        const runtimeRoot = resolve(args.rootDir, ".firedeck/runtime");
        fs.removeSync(runtimeRoot);
        fs.ensureDirSync(runtimeRoot);

        const runtimeRootHierarchy = generateRuntimeRootHierarchy();
        await writeOutputHierarchy(runtimeRoot, runtimeRootHierarchy);

        break;
      }
      case "add-client": {
        const runtimeClientRoot = resolve(
          args.rootDir,
          ".firedeck/runtime/modules",
          change.clientName,
        );

        const runtimeClientRootHierarchy = generateRuntimeClientHierarchy({
          clientName: change.clientName,
        });
        await writeOutputHierarchy(runtimeClientRoot, runtimeClientRootHierarchy);

        break;
      }
      case "remove-client": {
        const runtimeClientRoot = resolve(
          args.rootDir,
          ".firedeck/runtime/modules",
          change.clientName,
        );

        fs.removeSync(runtimeClientRoot);
        break;
      }
      case "rename-client": {
        const oldRuntimeClientRoot = resolve(
          args.rootDir,
          ".firedeck/runtime/modules",
          change.oldClientName,
        );

        const newRuntimeClientRoot = resolve(
          args.rootDir,
          ".firedeck/runtime/modules",
          change.newClientName,
        );

        fs.renameSync(oldRuntimeClientRoot, newRuntimeClientRoot);
        break;
      }
      case "update-client-routes":
        break;
    }
  }
}

// function createRoutingSource(routes: Workspace["clients"][number]["routes"]) {
//   const lines: string[] = [
//     `
//     import { type ReactNode, lazy, Suspense } from "react";
//     import { createBrowserRouter, redirect } from "react-router";
//
//     function withSuspense(child: ReactNode) {
//       return (
//         <Suspense
//           fallback={
//             <div className="w-screen h-full grid place-items-center">
//               <Spinner />
//             </div>
//           }>
//           {child}
//         </Suspense>
//       );
//     }
//     `,
//   ];
// }
