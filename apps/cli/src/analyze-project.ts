import {
  assertFiredeckRootDir,
  generateStringHash,
  getProjectPaths,
  NOT_FOUND_DIR_SUFFIX,
  NOT_FOUND_URL_PATH,
  RESERVED_MODULE_NAMES,
} from "@/utils";
import { relative, resolve, sep } from "node:path";
import fs from "fs-extra";
import { camelCase } from "lodash";
import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { FiredeckConfig } from "shared/firedeck-config";
import { ProjectClient, ProjectModel, ProjectRoute } from "@/types";

export async function analyzeProject(rootDir: string) {
  assertFiredeckRootDir(rootDir);

  const { modulesDir } = getProjectPaths(rootDir);

  const moduleNames = fs.readdirSync(modulesDir, { encoding: "utf-8" }).filter((moduleName) => {
    return (
      fs.lstatSync(resolve(modulesDir, moduleName)).isDirectory() &&
      !RESERVED_MODULE_NAMES.includes(moduleName)
    );
  });

  const projectClients: ProjectClient[] = [];

  for (const moduleName of moduleNames) {
    const clientDir = resolve(modulesDir, moduleName, "client");

    if (fs.existsSync(clientDir)) {
      const pagesDir = resolve(clientDir, "pages");
      if (!fs.existsSync(pagesDir)) throw `${relative(rootDir, pagesDir)} directory not found`;

      const clientRoutes = discoverRoutes(rootDir, pagesDir, pagesDir);

      const htmlPath = resolve(clientDir, "index.html");
      if (!fs.existsSync(htmlPath)) throw `${moduleName}/client/index.html not found`;

      const htmlContent = fs.readFileSync(htmlPath, { encoding: "utf-8" });

      const envPath = resolve(clientDir, ".env");
      const envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, { encoding: "utf-8" })
        : "";

      projectClients.push({
        name: moduleName,
        routes: clientRoutes,
        htmlHash: generateStringHash(htmlContent),
        envHash: generateStringHash(envContent),
      });
    }

    // const serverRoot = resolve(moduleRoot, "server");
  }

  const firedeckConfig = await parseFiredeckConfig(rootDir);

  const projectModel: ProjectModel = {
    config: firedeckConfig,
    clients: projectClients,
  };

  return projectModel;
}

function discoverRoutes(rootDir: string, dir: string, pagesDir: string): ProjectRoute {
  const { modulesDir } = getProjectPaths(rootDir);

  const relativeDir = relative(rootDir, dir);
  const dirContents = fs.readdirSync(dir, { encoding: "utf-8" }).map((name) => resolve(dir, name));
  const dirDirs = dirContents.filter((item) => fs.lstatSync(item).isDirectory());
  const dirFiles = dirContents.filter((item) => fs.lstatSync(item).isFile());
  const dirIsRoutable = !/\(\w+\)/.test(dir.split(sep).slice(-1)[0]);

  const getNameAndImportPath = (itemPath?: string): [null, null] | [string, string] => {
    if (!itemPath) return [null, null];

    const rawItemName = itemPath.split(sep).slice(-1)[0].split(".")[0];
    const itemName = rawItemName[0].toUpperCase() + camelCase(rawItemName).slice(1);
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(itemName))
      throw `${relative(modulesDir, itemPath)}: filename cannot be resolved to valid variable name: "${itemName}"`;

    const itemImportPath = `@/${relative(modulesDir, itemPath)}`;
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
    if (dir.endsWith(NOT_FOUND_DIR_SUFFIX)) return NOT_FOUND_URL_PATH;

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
      if (urlPath !== "/" || dirDirs.every((dir) => !dir.endsWith(NOT_FOUND_DIR_SUFFIX)))
        return dirDirs;

      const newDirDirs = [...dirDirs];
      const notFoundDir = newDirDirs.find((dir) => dir.endsWith(NOT_FOUND_DIR_SUFFIX))!;
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
          return discoverRoutes(rootDir, childDir, pagesDir);
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
      return discoverRoutes(rootDir, childDir, pagesDir);
    }),
  };
}

export async function parseFiredeckConfig(rootDir: string) {
  assertFiredeckRootDir(rootDir);

  const { configFile, workspaceDir } = getProjectPaths(rootDir);

  const bundle = await rollup({
    input: configFile,
    plugins: [nodeResolve(), commonjs(), typescript()],
    treeshake: { moduleSideEffects: false },
    external: ["firedeck"],
  });

  const bundledConfigFile = resolve(workspaceDir, "firedeck.config.mjs");
  await bundle.write({ file: bundledConfigFile, format: "esm" });
  await bundle.close();

  const config: FiredeckConfig = await import(bundledConfigFile).then((mod) => mod.default);
  fs.removeSync(bundledConfigFile);

  return config;
}
