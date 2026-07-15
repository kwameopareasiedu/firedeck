import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import { resolve } from "node:path";
import fs from "fs-extra";

const __dirname = import.meta.dirname;
const packageInfo = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
const external = [
  ...Object.keys(packageInfo.dependencies),
  ...Object.keys(packageInfo.devDependencies),
].map((dep) => new RegExp(`${dep}.+`));
const sourcePaths = fs
  .readdirSync(resolve(__dirname, "src"), { encoding: "utf-8" })
  .filter((filename) => !["index.ts", "types.ts"].includes(filename))
  .map((filename) => resolve(__dirname, "src", filename));

export default defineConfig([
  {
    input: "src/index.ts",
    output: { file: "bin/index.js", format: "commonjs" },
    plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
    treeshake: { moduleSideEffects: false },
    external: external,
  },
  ...sourcePaths.map((sourcePath) => ({
    input: sourcePath,
    output: { dir: "temp", format: "commonjs" },
    plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
    treeshake: { moduleSideEffects: false },
    external: external,
  })),
]);
