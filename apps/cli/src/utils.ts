import { format, Options } from "prettier";
import { extname, resolve } from "node:path";
import fs from "fs-extra";
import { FileTree } from "@/types";
import chalk from "chalk";

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

export async function writeFileTree(rootDir: string, tree: FileTree) {
  for (const relativePath in tree) {
    const absPath = resolve(rootDir, relativePath);
    const output = tree[relativePath];
    const outputExt = output.extension || extname(absPath);
    const formattedContent = await format(
      output.content,
      getPrettierConfig({ filePath: `a.${outputExt}`.replaceAll("..", ".") }),
    );

    fs.ensureFileSync(absPath);
    fs.writeFileSync(absPath, Buffer.from(formattedContent, "utf-8"));
  }
}

export function pathIsFiredeckRoot(path: string) {
  return fs.existsSync(resolve(path, "firedeck.json"));
}

export function parseErrorMessage(err: unknown) {
  if (typeof err === "string") return err;
  else if (typeof err === "object") return (err as Record<string, string>).message;
  else return (err as object).toString();
}

export function info(msg: string, ...args: unknown[]) {
  console.log(`${chalk.bgGreen.black("firedeck")}: ${chalk.green(msg)}`, ...args);
}

export function warn(msg: unknown, ...args: unknown[]) {
  console.log(`${chalk.bgYellow.black("firedeck")}: ${chalk.yellow(msg)}`, ...args);
}

export function error(msg: unknown, ...args: unknown[]) {
  console.log(`${chalk.bgRed.black("firedeck")}: ${chalk.red(msg)}`, ...args);
}

export function generateStringHash(str: string) {
  let hash = 0;

  for (const char of str) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  return hash;
}
