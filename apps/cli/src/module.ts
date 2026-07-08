import { generateModuleContents } from "@/templates";
import { writeFileContents } from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import { ClientApplication, ModuleComponents, RouteConfig } from "@/types";

export async function createModule(args: {
  rootDir: string;
  name: string;
  components?: ModuleComponents;
}) {
  const components: ModuleComponents = args.components || "all";
  const moduleContents = generateModuleContents({ name: args.name, components: components });
  const modulesRoot = resolve(args.rootDir, `modules/${args.name}`);

  if (fs.existsSync(modulesRoot) && fs.readdirSync(modulesRoot).length !== 0)
    throw `${modulesRoot}: directory is not empty`;

  await writeFileContents(args.rootDir, moduleContents);

  console.log(`Created new module '${args.name}': ${modulesRoot}`);
}

export async function analyzeModules(args: { rootDir: string }) {
  const modulesRoot = resolve(args.rootDir, "modules");
  const moduleNames = fs.readdirSync(modulesRoot, { encoding: "utf-8" }).filter((moduleName) => {
    return fs.lstatSync(resolve(modulesRoot, moduleName)).isDirectory() && moduleName !== "shared";
  });

  for (const moduleName of moduleNames) {
    const moduleRoot = resolve(modulesRoot, moduleName);
    const clientRoot = resolve(moduleRoot, "client");
    let clientApplication: ClientApplication | undefined;

    if (fs.existsSync(clientRoot)) {
      const pagesRoot = resolve(clientRoot, "pages");
      const pagePaths = fs.readdirSync(pagesRoot, { encoding: "utf-8", recursive: true });
      const routeFilePaths = pagePaths
        .map((pagePath) => resolve(pagesRoot, pagePath))
        .filter((pagePath) => fs.lstatSync(pagePath).isFile() && pagePath.endsWith(".route.tsx"));

      const routes: RouteConfig[] = routeFilePaths.map((routeFilePath) => {
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
          path: "/" + filePathSegments.join("/"),
          importPath: "@/" + relative(modulesRoot, routeFilePath),
        };
      });

      clientApplication = {
        routes: routes,
      };
    }

    const serverRoot = resolve(moduleRoot, "server");

    console.dir({ client: clientApplication }, { depth: null });
  }
}
