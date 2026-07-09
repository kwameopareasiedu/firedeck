import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import fs from "fs-extra";

const packageInfo = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
const external = Object.keys(packageInfo.dependencies).map((dep) => new RegExp(`${dep}.+`));

export default defineConfig([
  {
    input: "src/index.ts",
    output: { file: "bin/index.js", format: "commonjs" },
    plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
    treeshake: { moduleSideEffects: false },
    external: external,
  },
  {
    input: "src/functions.ts",
    output: { file: "temp/functions.js", format: "commonjs" },
    plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
    treeshake: { moduleSideEffects: false },
    external: external,
  },
  {
    input: "src/utils.ts",
    output: { file: "temp/utils.js", format: "commonjs" },
    plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
    treeshake: { moduleSideEffects: false },
    external: external,
  },
]);
