import { generateStringHash, pathIsFiredeckRoot, writeFileTree } from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import { generateModuleFileTree, generateProjectFileTree } from "@/templates";
import { ModuleComponents, RouteNode } from "@/types";
import * as acorn from "acorn";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import jsx from "acorn-jsx";
import * as walk from "acorn-walk";
// @ts-expect-error declaration don't exist
import * as walkJsx from "acorn-jsx-walk";
import { Runtime, RuntimeClient } from "@/runtime";

walkJsx.extend(walk.base);

export class Project {
  private readonly rootDir: string;
  private readonly modulesDir: string;
  private readonly runtimeDir: string;
  private readonly clientSdkDir: string;

  constructor(args: { rootDir: string }) {
    this.rootDir = args.rootDir;
    this.modulesDir = resolve(args.rootDir, "modules");
    this.runtimeDir = resolve(args.rootDir, ".firedeck/runtime");
    this.clientSdkDir = resolve(args.rootDir, ".firedeck/client-sdk");
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
    this.assertRootIsFiredeckProject();

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
    this.assertRootIsFiredeckProject();

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

  private assertRootIsFiredeckProject() {
    if (!pathIsFiredeckRoot(this.rootDir))
      throw `${this.rootDir}: directory is not a valid firedeck project`;
  }

  private discoverRoutes(dir: string, pagesDir: string): RouteNode {
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
    // if (pageFiles.length > 1) throw `${relativeDir} contains multiple page files`;
    // if (!dirIsRoutable && pageFiles.length > 0)
    //   throw `${relativeDir} is not routable but contains a page file: ${pageFiles[0]}`;

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

    const urlPath = pageImportPath
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
}
