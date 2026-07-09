import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";
import {
  generateModuleHierarchy,
  generateRuntimeRootHierarchy,
  generateProjectHierarchy,
  generateRuntimeClientHierarchy,
} from "@/templates";
import { pathIsFiredeckRoot, writeOutputHierarchy } from "@/utils";
import { ModuleComponents, Workspace, WorkspaceChange } from "@/types";

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

export async function createRuntime(args: { rootDir: string }) {
  const runtime = await analyzeProject({ rootDir: args.rootDir });
  const runtimeRoot = resolve(args.rootDir, ".firedeck/runtime");
  const runtimeRootHierarchy = generateRuntimeRootHierarchy();

  await writeOutputHierarchy(runtimeRoot, runtimeRootHierarchy);

  for (const client of runtime.clients) {
    const clientRoot = resolve(runtimeRoot, "modules", client.name);
    const runtimeClientHierarchy = generateRuntimeClientHierarchy({ moduleName: client.name });

    await writeOutputHierarchy(clientRoot, runtimeClientHierarchy);
  }
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
      const workspaceClient: Workspace["clients"][number] = {
        name: moduleName,
        routes: [],
      };

      const pagesRoot = resolve(clientRoot, "pages");
      if (!fs.existsSync(pagesRoot)) throw `${moduleName}/client/pages directory not found`;

      const pagePaths = fs.readdirSync(pagesRoot, { encoding: "utf-8", recursive: true });
      const routeFilePaths = pagePaths
        .map((pagePath) => resolve(pagesRoot, pagePath))
        .filter((pagePath) => fs.lstatSync(pagePath).isFile() && pagePath.endsWith(".route.tsx"));

      const routes: Workspace["clients"][number]["routes"] = routeFilePaths.map((routeFilePath) => {
        const relativeRouteFilePath = relative(pagesRoot, routeFilePath).split(".route.tsx")[0];
        const filePathSegments = relativeRouteFilePath
          .split(sep)
          .filter((segment) => segment !== "index")
          .map((segment) => {
            const pathParamRegex = /^\[(\w+)]$/;

            if (!pathParamRegex.test(segment)) return segment;

            const matches = pathParamRegex.exec(segment);
            if (!matches) return segment;

            return ":" + matches[1];
          });

        return {
          urlPath: "/" + filePathSegments.join("/"),
          importPath: "@/" + relative(modulesRoot, routeFilePath),
        };
      });

      workspaceClient.routes.push(...routes);
      workspace.clients.push(workspaceClient);
    }

    // const serverRoot = resolve(moduleRoot, "server");
  }

  return workspace;
}

export function compareWorkspaces(w1: Workspace, w2: Workspace) {
  const changes: WorkspaceChange[] = [];

  for (let cIdx = 0; cIdx < Math.max(w1.clients.length, w2.clients.length); cIdx++) {
    const w1c = w1.clients[cIdx];
    const w2c = w2.clients[cIdx];

    if (!w1c && w2c) {
      changes.push({
        type: "client-added",
        clientName: w2c.name,
      });
    } else if (w1c && !w2c) {
      changes.push({
        type: "client-removed",
        clientName: w1c.name,
      });
    } else if (w1c && w2c) {
      if (w1c.name !== w2c.name) {
        changes.push({
          type: "client-renamed",
          oldClientName: w1c.name,
          newClientName: w2c.name,
        });
      }

      for (let rIdx = 0; rIdx < Math.max(w1c.routes.length, w2c.routes.length); rIdx++) {
        const w1cr = w1c.routes[rIdx];
        const w2cr = w2c.routes[rIdx];

        if ((!w1cr && w2cr) || (w1cr && !w2cr) || w1cr.importPath !== w2cr.importPath) {
          changes.push({ type: "client-routes-modified", clientName: w2c.name });
          break;
        }
      }
    }
  }

  return changes;
}
