import { format, Options } from "prettier";
import { extname, resolve } from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { FileTree } from "@/types";
import { camelCase, kebabCase, snakeCase } from "lodash";
import { execSync } from "node:child_process";

export enum FiredeckMode {
  DEV = "dev",
  BUILD = "build",
}

/** React router catch-all route path */
export const NOT_FOUND_URL_PATH = "/*";

/** Returns relevant file paths of a Firedeck project */
export function getProjectPaths(rootDir: string) {
  // prettier-ignore
  return {
    packageJsonFile: resolve(rootDir, "package.json"),
    envFile: resolve(rootDir, ".env"),
    configFile: resolve(rootDir, "firedeck.config.ts"),
    modulesDir: resolve(rootDir, "modules"),
    clientModulesDir: resolve(rootDir, "modules/client"),
    getClientModuleDir: (clientName: string) => resolve(rootDir, "modules/client", clientName),
    getClientModulePagesDir: (clientName: string) => resolve(rootDir, "modules/client", clientName, "pages"),
    getClientModulePublicDir: (clientName: string) => resolve(rootDir, "modules/client", clientName, "public"),
    getClientModuleIndexHtmlFile: (clientName: string) => resolve(rootDir, "modules/client", clientName, "index.html"),
    backendModulesDir: resolve(rootDir, "modules/backend"),
    getBackendModuleDir: (backendName: string) => resolve(rootDir, "modules/backend", backendName),
    getBackendModuleFunctionsDir: (backendName: string) => resolve(rootDir, "modules/backend", backendName, "functions"),
    workspaceDir: resolve(rootDir, "firedeck"),
    workspaceClientEnvTypesFile: resolve(rootDir, "firedeck/env-client.d.ts"),
    workspaceBackendEnvTypesFile: resolve(rootDir, "firedeck/env-backend.d.ts"),
    workspaceConfigFile: resolve(rootDir, "firedeck/firedeck.config.mjs"),
    runtimeDir: resolve(rootDir, "firedeck/runtime"),
    runtimeModulesDir: resolve(rootDir, "firedeck/runtime/modules"),
    getRuntimeClientModuleDir: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName),
    getRuntimeClientModuleDistDir: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName, "dist"),
    getRuntimeClientModuleIndexHtmlFile: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName, "index.html"),
    getRuntimeClientModuleEnvFile: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName, ".env"),
    getRuntimeClientModuleRoutesFile: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName, "src/routes.ts"),
    getRuntimeClientModulePublicDir: (clientName: string) => resolve(rootDir, "firedeck/runtime/modules", clientName, "public"),
    getRuntimeBackendModuleDir: (backendName: string) => resolve(rootDir, "firedeck/runtime/modules", backendName),
    getRuntimeBackendModuleFunctionsFile: (backendName: string) => resolve(rootDir, "firedeck/runtime/modules", backendName, "src/functions.ts"),
    getRuntimeBackendModuleEnvFile: (backendName: string) => resolve(rootDir, "firedeck/runtime/modules", backendName, ".env"),
    runtimeFirebaseRcFile: resolve(rootDir, "firedeck/runtime/.firebaserc"),
    runtimeFirebaseJsonFile: resolve(rootDir, "firedeck/runtime/firebase.json"),
    runtimeFirebaseFirestoreJsonFile: resolve(rootDir, "firedeck/runtime/firestore.json"),
    runtimeFirebaseFirestoreRulesFile: resolve(rootDir, "firedeck/runtime/firestore.rules"),
    runtimeFirebaseStorageRulesFile: resolve(rootDir, "firedeck/runtime/storage.rules"),
    clientSdkDir: resolve(rootDir, "firedeck/client-sdk"),
    getClientSdkFile: (clientName: string) => resolve(rootDir, `firedeck/client-sdk/${kebabCase(clientName)}.ts`),
  };
}

/** Ensures that the given `dir` is a Firedeck project or throws an error */
export function assertFiredeckRootDir(dir: string) {
  const { configFile } = getProjectPaths(dir);

  if (!fs.existsSync(configFile)) throw `${dir}: directory is not a firedeck project`;
}

/** Returns configuration for the [Prettier](https://prettier.io) for consistent code formatting */
export function getPrettierConfig(args: { filePath: string }): Options {
  return {
    filepath: args.filePath,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    singleQuote: false,
    jsxSingleQuote: false,
    trailingComma: "all",
    semi: true,
    bracketSameLine: true,
    arrowParens: "always",
  };
}

/**
 * Writes the given `FileTree` object to the file system, formatting each file according to its
 * extension and overwriting existing files.
 */
export async function writeFileTree(rootDir: string, tree: FileTree) {
  for (const relativePath in tree) {
    const absPath = resolve(rootDir, relativePath);
    const output = tree[relativePath];
    const outputExt = output.extension === null ? null : output.extension || extname(absPath);
    const formattedContent = !outputExt
      ? output.content
      : await format(
          output.content,
          getPrettierConfig({ filePath: `a.${outputExt}`.replaceAll("..", ".") }),
        );

    fs.ensureFileSync(absPath);
    fs.writeFileSync(absPath, Buffer.from(formattedContent, "utf-8"));
  }
}

/** Parses the message from an error object */
export function parseErrorMessage(err: unknown) {
  if (typeof err === "string") return err;
  else if (typeof err === "object") return (err as Record<string, string>).message;
  else return (err as object).toString();
}

/**
 * Custom info logger, which formats with the
 * [chalk](https://github.com/chalk/chalk?tab=readme#) library
 */
export function info(msg: string, ...args: unknown[]) {
  console.log(`${chalk.green.bold("firedeck")}: ${chalk.green(msg)}`, ...args);
}

/**
 * Custom info logger, which formats with the
 * [chalk](https://github.com/chalk/chalk?tab=readme#) library
 */
export function warn(msg: unknown, ...args: unknown[]) {
  console.log(`${chalk.yellow.bold("firedeck")}: ${chalk.yellow(msg)}`, ...args);
}

/**
 * Custom info logger, which formats with the
 * [chalk](https://github.com/chalk/chalk?tab=readme#) library
 */
export function error(msg: unknown, ...args: unknown[]) {
  console.log(`${chalk.red.bold("firedeck")}: ${chalk.red(msg)}`, ...args);
}

/** Converts the string to pascal case */
export function pascalCase(str: string) {
  const camelCased = camelCase(str);
  return camelCased[0].toUpperCase() + camelCased.slice(1);
}

/** Converts the string to screaming snake case */
export function screamingSnakeCase(str: string) {
  return snakeCase(str).toUpperCase();
}

/** Returns the ASCII art for Firedeck */
export function getFiredeckAsciiArt() {
  return `
███████╗ ██╗ ██████╗  ███████╗ ██████╗  ███████╗  ██████╗ ██╗  ██╗
█████╗   ██║ ██████╝  █████╗   ██║  ██║ █████╗   ██║      █████╔╝ 
██║      ██║ ██║  ██║ ███████╗ ██████╔╝ ███████╗ ╚██████╗ ██║  ██╗
╚═╝      ╚═╝ ╚═╝  ╚═╝ ╚══════╝ ╚═════╝  ╚══════╝  ╚═════╝ ╚═╝  ╚═╝`;
}

/** Async version of reduce function on arrays */
export async function reduceAsync<T, R>(
  items: T[],
  map: (acc: R, item: T) => Promise<R>,
  initial: R,
) {
  let results = initial;

  for (const item of items) {
    results = await map(results, item);
  }

  return results;
}

/** Runs a firebase CLI command via child_process and returns the results in JSON format */
export function runFirebaseCmd<T>(
  subCommand: string,
  projectId: string,
  opts?: { cwd?: string; noJson?: boolean },
) {
  const script = `firebase ${subCommand} --project ${projectId} ${!opts?.noJson ? "--json" : ""}`;
  info(script);

  const response = execSync(script, {
    cwd: opts?.cwd,
    encoding: "utf-8",
    stdio: !opts?.noJson ? undefined : "inherit",
  });

  if (opts?.noJson) return null as T;

  const parsedResponse = JSON.parse(response);

  if (parsedResponse.status === "error") throw parsedResponse.error;
  return parsedResponse.result as T;
}
