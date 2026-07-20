import { format, Options } from "prettier";
import { extname, resolve } from "node:path";
import fs from "fs-extra";
import { FileTree } from "@/types";
import chalk from "chalk";
import { camelCase, snakeCase } from "lodash";

/** React router catch-all route path */
export const NOT_FOUND_URL_PATH = "/*";

/** Returns relevant file paths of a Firedeck project */
export function getProjectPaths(rootDir: string) {
  return {
    envFile: resolve(rootDir, ".env"),
    configFile: resolve(rootDir, "firedeck.config.ts"),
    modulesDir: resolve(rootDir, "modules"),
    clientModulesDir: resolve(rootDir, "modules/client"),
    getClientModulePagesDir: (clientName: string) =>
      resolve(rootDir, "modules/client", clientName, "pages"),
    getClientModulePublicDir: (clientName: string) =>
      resolve(rootDir, "modules/client", clientName, "public"),
    getClientModuleIndexHtmlFile: (clientName: string) =>
      resolve(rootDir, "modules/client", clientName, "index.html"),
    backendModulesDir: resolve(rootDir, "modules/backend"),
    getBackendModuleFunctionsDir: (backendName: string) =>
      resolve(rootDir, "modules/backend", backendName, "functions"),
    workspaceDir: resolve(rootDir, ".firedeck"),
    workspaceEnvTypesFile: resolve(rootDir, ".firedeck/env.d.ts"),
    workspaceConfigFile: resolve(rootDir, ".firedeck/firedeck.config.mjs"),
    workspaceConfigTypesFile: resolve(rootDir, ".firedeck/firedeck.config.d.mts"),
    runtimeDir: resolve(rootDir, ".firedeck/runtime"),
    runtimeFirebaseRcFile: resolve(rootDir, ".firedeck/runtime/.firebaserc"),
    runtimeFirebaseJsonFile: resolve(rootDir, ".firedeck/runtime/firebase.json"),
    runtimeModulesDir: resolve(rootDir, ".firedeck/runtime/modules"),
    clientSdkDir: resolve(rootDir, "modules/sdk/client"),
    clientSdkRoutesFile: resolve(rootDir, "modules/sdk/client/routes.ts"),
    getClientSdkClientModuleApiFile: (clientName: string) =>
      resolve(rootDir, `modules/sdk/client/${clientName}-api.ts`),
  };
}

/** Ensures that the given `rootDir` is a Firedeck project by ensuring the `firedeck.config.ts` file exists */
export function assertFiredeckRootDir(rootDir: string) {
  const { configFile } = getProjectPaths(rootDir);

  if (!fs.existsSync(configFile)) throw `${rootDir}: directory is not a firedeck project`;
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

/** Generates a non-negative deterministic hash for the given string */
export function generateStringHash(str: string) {
  let hash = 0;

  for (const char of str) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
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
