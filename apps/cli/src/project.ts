import {
  error,
  generateStringHash,
  getPrettierConfig,
  info,
  pathIsFiredeckRoot,
  writeFileTree,
} from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import {
  generateModuleFileTree,
  generateProjectFileTree,
  generateRuntimeClientFileTree,
  generateRuntimeFileTree,
} from "@/templates";
import { ModuleComponents } from "@/types";
import { ClientRoute, ReactRouterRoute, Runtime, RuntimeChange, RuntimeClient } from "@/runtime";
import { format } from "prettier";
import { camelCase, snakeCase, startCase } from "lodash";
import { exec, spawn } from "node:child_process";
import chokidar from "chokidar";
import kill from "tree-kill";

export class Project {
  private static readonly RESERVED_MODULE_NAMES = ["shared", "sdk"];
  private static readonly NOT_FOUND_DIR_SUFFIX = "404";
  private static readonly NOT_FOUND_URL_PATH = "/*";

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
    this.clientSdkDir = resolve(args.rootDir, "modules/sdk/client");
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
          !Project.RESERVED_MODULE_NAMES.includes(moduleName)
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

        const envPath = resolve(clientDir, ".env");
        const envContent = fs.existsSync(envPath)
          ? fs.readFileSync(envPath, { encoding: "utf-8" })
          : "";

        runtimeClients.push({
          name: moduleName,
          routes: clientRoutes,
          htmlHash: generateStringHash(htmlContent),
          envHash: generateStringHash(envContent),
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
        case "add-runtime-client": {
          const clientRoot = resolve(this.runtimeModulesDir, change.clientName);
          const clientFileTree = generateRuntimeClientFileTree({ clientName: change.clientName });
          await writeFileTree(clientRoot, clientFileTree);
          break;
        }
        case "remove-runtime-client": {
          const clientRoot = resolve(this.runtimeModulesDir, change.clientName);
          fs.removeSync(clientRoot);
          break;
        }
        case "rename-runtime-client": {
          const oldClientRoot = resolve(this.runtimeModulesDir, change.oldClientName);
          const newClientRoot = resolve(this.runtimeModulesDir, change.newClientName);
          fs.renameSync(oldClientRoot, newClientRoot);
          break;
        }
        case "update-runtime-client-routes": {
          const { clientName, clientRoutes } = change;
          const clientRouterFile = resolve(this.runtimeModulesDir, clientName, "src/router.tsx");
          const runtimeClientRouterSource = await this.generateClientRouterSource(clientRoutes);
          fs.writeFileSync(clientRouterFile, runtimeClientRouterSource);
          break;
        }
        case "update-runtime-client-html": {
          const htmlSrc = resolve(this.modulesDir, change.clientName, "client/index.html");
          const htmlDest = resolve(this.runtimeModulesDir, change.clientName, "index.html");

          if (fs.existsSync(htmlSrc)) fs.copyFileSync(htmlSrc, htmlDest);
          break;
        }
        case "update-runtime-client-env": {
          const envSrc = resolve(this.modulesDir, change.clientName, "client/.env");
          const envDest = resolve(this.runtimeModulesDir, change.clientName, ".env");

          if (fs.existsSync(envSrc)) fs.copyFileSync(envSrc, envDest);
          break;
        }
        case "update-client-sdk-routes": {
          const sdkRoutesFile = resolve(this.clientSdkDir, "routes.ts");
          const routesSource = await this.generateClientSdkRoutesSource(change.clients);
          fs.ensureFileSync(sdkRoutesFile);
          fs.writeFileSync(sdkRoutesFile, routesSource);
          break;
        }
      }
    }
  }

  async run(args: { log: typeof info; error: typeof error }) {
    this.assertFiredeckRootDir();

    const compile = async (currentRuntime: Runtime | null) => {
      const updatedRuntime = await this.analyze();
      const runtimeChanges = updatedRuntime.diffFrom(currentRuntime);
      await this.updateRuntime(runtimeChanges);

      return [updatedRuntime, runtimeChanges] as const;
    };

    let [currentRuntime] = await compile(null);

    const lockFileNames = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lock",
      "bun.lockb",
      "deno.lock",
    ];

    for (const lockFileName of lockFileNames) {
      const lockFilePath = resolve(this.rootDir, lockFileName);

      if (fs.existsSync(lockFilePath)) {
        const destPath = resolve(this.runtimeDir, lockFileName);
        fs.copyFileSync(lockFilePath, destPath);
        break;
      }
    }

    let runtimeDevProc = spawn("yarn", ["dev"], { cwd: this.runtimeDir, stdio: "inherit" });
    let changeDebounceTimer: NodeJS.Timeout | null = null;

    const handleChange = async (path: string, eventName: string) => {
      if (stopping) return;

      if (changeDebounceTimer) clearTimeout(changeDebounceTimer);

      changeDebounceTimer = setTimeout(async () => {
        try {
          args.log(`${eventName}: ${relative(this.modulesDir, path)}`);
          const [updatedRuntime, runtimeChanges] = await compile(currentRuntime);
          currentRuntime = updatedRuntime;

          const restartRuntimeDevProc = runtimeChanges.some((change) =>
            (
              [
                "add-runtime-client",
                "remove-runtime-client",
                "rename-runtime-client",
                "update-runtime-client-env",
              ] as RuntimeChange["type"][]
            ).includes(change.type),
          );

          if (restartRuntimeDevProc) {
            kill(runtimeDevProc.pid!);
            await new Promise((resolve) => setTimeout(resolve, 1250));

            if (runtimeDevProc.exitCode === null) {
              kill(runtimeDevProc.pid!, "SIGKILL");
              await new Promise((resolve) => setTimeout(resolve, 1250));
            }

            runtimeDevProc = spawn("yarn", ["dev"], { cwd: this.runtimeDir, stdio: "inherit" });
          }
        } catch (err) {
          args.error(err);
        }
      }, 500);
    };

    const fileWatcher = chokidar
      .watch(this.modulesDir, { persistent: true, awaitWriteFinish: { stabilityThreshold: 500 } })
      .on("ready", () => args.log("watching modules"))
      .on("error", (err) => args.error(`error: ${err}`))
      .on("add", async (path) => await handleChange(path, "new-file"))
      .on("addDir", async (path) => await handleChange(path, "new-dir"))
      .on("change", async (path) => await handleChange(path, "change"))
      .on("unlink", async (path) => await handleChange(path, "delete-file"))
      .on("unlinkDir", async (path) => await handleChange(path, "delete-dir"));

    let stopping = false;

    process.on("SIGINT", async () => {
      if (!stopping) {
        stopping = true;
        args.log("SIGINT received; terminating runtime");
        kill(runtimeDevProc.pid!);
        await fileWatcher.close();
        await new Promise((resolve) => setTimeout(resolve, 1250));

        if (runtimeDevProc.exitCode === null) {
          kill(runtimeDevProc.pid!, "SIGKILL");
          await new Promise((resolve) => setTimeout(resolve, 1250));
        }
      } else args.log("runtime terminating");
    });

    args.log("runtime started");
  }

  async build(args: { log: typeof info; error: typeof error }) {
    this.assertFiredeckRootDir();

    const lockFileNames = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lock",
      "bun.lockb",
      "deno.lock",
    ];

    for (const lockFileName of lockFileNames) {
      const lockFilePath = resolve(this.rootDir, lockFileName);

      if (fs.existsSync(lockFilePath)) {
        const destPath = resolve(this.runtimeDir, lockFileName);
        fs.copyFileSync(lockFilePath, destPath);
        break;
      }
    }

    const runtime = await this.analyze();
    const runtimeChanges = runtime.diffFrom(null);
    await this.updateRuntime(runtimeChanges);

    const runtimeBuildProc = exec("yarn build", { cwd: this.runtimeDir });
    runtimeBuildProc.stdout?.on("data", console.log);
    runtimeBuildProc.stderr?.on("error", console.error);
    runtimeBuildProc.on("error", args.error);
    runtimeBuildProc.on("close", (exitCode) => {
      if (exitCode !== 0) {
        args.error("build failed");
      } else {
        const msg = runtime.clients.reduce((msg, client) => {
          const clientDist = `${this.runtimeDir}/modules/${client.name}/dist`;
          return msg + `${client.name}: ${relative(this.rootDir, clientDist)}\n`;
        }, "");

        args.log("build complete\n" + msg);
      }
    });
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

    const getNameAndImportPath = (itemPath?: string): [null, null] | [string, string] => {
      if (!itemPath) return [null, null];

      const rawItemName = itemPath.split(sep).slice(-1)[0].split(".")[0];
      const itemName = rawItemName[0].toUpperCase() + camelCase(rawItemName).slice(1);
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(itemName))
        throw `${relative(this.modulesDir, itemPath)}: filename cannot be resolved to valid variable name: "${itemName}"`;

      const itemImportPath = `@/${relative(this.modulesDir, itemPath)}`;
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
      if (dir.endsWith(Project.NOT_FOUND_DIR_SUFFIX)) return Project.NOT_FOUND_URL_PATH;

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
        if (urlPath !== "/" || dirDirs.every((dir) => !dir.endsWith(Project.NOT_FOUND_DIR_SUFFIX)))
          return dirDirs;

        const newDirDirs = [...dirDirs];
        const notFoundDir = newDirDirs.find((dir) => dir.endsWith(Project.NOT_FOUND_DIR_SUFFIX))!;
        newDirDirs.splice(newDirDirs.indexOf(notFoundDir), 1);
        newDirDirs.push(notFoundDir);
        return newDirDirs;
      })();

      return {
        pageName: null,
        pageImportPath: null,
        layoutName: layoutName,
        layoutImportPath: layoutImportPath,
        placeholderName: null,
        placeholderImportPath: null,
        guardName: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: pageName,
            pageImportPath: pageImportPath,
            layoutName: null,
            layoutImportPath: null,
            placeholderName: placeholderName,
            placeholderImportPath: placeholderImportPath,
            guardName: guardName,
            guardImportPath: guardImportPath,
            urlPath: urlPath,
            children: [],
          },
          ...dirDirsWith404Last.map((childDir) => {
            return this.discoverRoutes(childDir, pagesDir);
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
        return this.discoverRoutes(childDir, pagesDir);
      }),
    };
  }

  private async generateClientRouterSource(routes: ClientRoute) {
    function createReplaceTarget(str: string) {
      return `$$${str}$$`;
    }

    function generateReactRouterRoute(route: ClientRoute): ReactRouterRoute {
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

    const routeImportSource = this.flattenRoutes(routes).reduce((importSrc, route) => {
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

  private async generateClientSdkRoutesSource(clients: RuntimeClient[]) {
    const routerSource = clients.reduce((source, client) => {
      const routeEnumSource = this.flattenRoutes(client.routes).reduce((source, route) => {
        if (!route.pageName || !route.urlPath || route.urlPath === Project.NOT_FOUND_URL_PATH)
          return source;

        return source + `${snakeCase(route.pageName).toUpperCase()} = "${route.urlPath}",\n`;
      }, "");

      const clientSource = `export enum ${startCase(client.name).replaceAll(" ", "")}Route { ${routeEnumSource} };\n`;

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

  private flattenRoutes(route: ClientRoute): ClientRoute[] {
    return [
      { ...route, children: [] },
      ...route.children.reduce((flats, childRoute) => {
        return [...flats, ...this.flattenRoutes(childRoute)];
      }, [] as ClientRoute[]),
    ];
  }
}
