import { format, Options } from "prettier";
import { FSContents } from "@/templates";
import { extname, resolve } from "node:path";
import fs from "fs-extra";

export const getPrettierConfig = (args: { filePath: string }): Options => ({
  filepath: args.filePath,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  singleQuote: false,
  jsxSingleQuote: false,
  trailingComma: "all",
  semi: true,
  bracketSameLine: true,
  arrowParens: "always",
});

export const writeFileContents = async (contents: FSContents, rootDir: string) => {
  for (const relativePath in contents) {
    const filePath = resolve(rootDir, relativePath);
    const fileProperties = contents[relativePath];
    const fileExt = fileProperties.extension || extname(filePath);
    const fileContent = await format(
      fileProperties.content,
      getPrettierConfig({ filePath: "a." + fileExt }),
    );

    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, Buffer.from(fileContent, "utf-8"));
  }
};

export const cwdIsRoot = () => {
  return fs.existsSync(resolve(process.cwd(), "firedeck.json"));
};

export const parseErrorMessage = (err: unknown) => {
  if (typeof err === "string") return err;
  else if (typeof err === "object") return (err as Record<string, string>).message;
  else return (err as object).toString();
};
