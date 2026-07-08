import { Options } from "prettier";

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
