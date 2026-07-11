import { format, Options } from "prettier";
import { extname, resolve } from "node:path";
import fs from "fs-extra";
import { OutputHierarchy } from "@/types";

export function getPrettierConfig(args: { filePath: string }): Options {
  return {
    filepath: args.filePath,
    tabWidth: 2,
    useTabs: false,
    printWidth: 240,
    singleQuote: false,
    jsxSingleQuote: false,
    trailingComma: "all",
    semi: true,
    bracketSameLine: true,
    arrowParens: "always",
  };
}

export async function writeOutputHierarchy(rootDir: string, hierarchy: OutputHierarchy) {
  for (const relativePath in hierarchy) {
    const absPath = resolve(rootDir, relativePath);
    const output = hierarchy[relativePath];
    const outputExt = output.extension || extname(absPath);
    const formattedContent = await format(
      output.content,
      getPrettierConfig({ filePath: `a.${outputExt}`.replaceAll("..", ".") }),
    );

    fs.ensureFileSync(absPath);
    fs.writeFileSync(absPath, Buffer.from(formattedContent, "utf-8"));
  }
}

export function cwdIsRoot() {
  return fs.existsSync(resolve(process.cwd(), "firedeck.json"));
}

export function pathIsFiredeckRoot(path: string) {
  return fs.existsSync(resolve(path, "firedeck.json"));
}

export function parseErrorMessage(err: unknown) {
  if (typeof err === "string") return err;
  else if (typeof err === "object") return (err as Record<string, string>).message;
  else return (err as object).toString();
}
