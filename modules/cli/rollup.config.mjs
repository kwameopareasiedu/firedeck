import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { typescriptPaths } from "rollup-plugin-typescript-paths";

export default defineConfig({
  input: "src/index.ts",
  output: { file: "bin/index.js", format: "commonjs" },
  plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
  treeshake: { moduleSideEffects: false },
});
