import { format, Options } from "prettier";
import { extname, resolve } from "node:path";
import fs from "fs-extra";
import { FileTree } from "@/types";
import chalk from "chalk";

/** Regex matcher for a line of the root .env file (E.g. MAIN__VITE_FOO=bar) */
export const ENV_VAR_LINE_MATCH_REGEX = /^.+?__\w+=.+$/;
/** Regex matcher for splitting the module name from a line of the root .env file (E.g. MAIN__) */
export const ENV_VAR_LINE_SPLIT_REGEX = /^.+?__/;
/** Module name separator of a line of the root .env file */
export const ENV_VAR_KEY_VALUE_SEPARATOR = "__";
/** Pages-level not-found directory name */
export const NOT_FOUND_DIR_SUFFIX = "404";
/** React router catch-all route path */
export const NOT_FOUND_URL_PATH = "/*";

/** Returns relevant file paths of a Firedeck project */
export function getProjectPaths(rootDir: string) {
  return {
    rootDir: rootDir,
    envFile: resolve(rootDir, ".env"),
    configFile: resolve(rootDir, "firedeck.config.ts"),
    modulesDir: resolve(rootDir, "modules"),
    clientModulesDir: resolve(rootDir, "modules/client"),
    backendModulesDir: resolve(rootDir, "modules/backend"),
    workspaceDir: resolve(rootDir, ".firedeck"),
    workspaceEnvTypesFile: resolve(rootDir, ".firedeck/env.d.ts"),
    workspaceConfigFile: resolve(rootDir, ".firedeck/firedeck.config.mjs"),
    workspaceConfigTypesFile: resolve(rootDir, ".firedeck/firedeck.config.d.mts"),
    runtimeDir: resolve(rootDir, ".firedeck/runtime"),
    runtimeFirebaseRcFile: resolve(rootDir, ".firedeck/runtime/.firebaserc"),
    runtimeFirebaseJsonFile: resolve(rootDir, ".firedeck/runtime/firebase.json"),
    runtimeModulesDir: resolve(rootDir, ".firedeck/runtime/modules"),
    clientSdkDir: resolve(rootDir, "modules/sdk/client"),
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
    const outputExt = output.extension || extname(absPath);
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
