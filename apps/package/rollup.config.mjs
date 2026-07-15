import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import { resolve } from "node:path";
import fs from "fs-extra";

const __dirname = import.meta.dirname;
const packageInfo = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
const external = Object.keys(packageInfo.dependencies).map((dep) => new RegExp(`${dep}.+`));
const sourcePaths = fs
  .readdirSync(resolve(__dirname, "src"), { encoding: "utf-8" })
  .map((filename) => resolve(__dirname, "src", filename));

export default defineConfig(
  sourcePaths.reduce((configs, sourcePath) => {
    return [
      ...configs,
      {
        input: sourcePath,
        output: { dir: "dist", format: "commonjs" },
        plugins: [nodeResolve(), commonjs(), typescript(), typescriptPaths()],
        treeshake: { moduleSideEffects: false },
        external: external,
      },
      {
        input: sourcePath,
        output: { dir: "dist" },
        plugins: [typescript(), dts()],
        external: ["vite"],
      },
    ];
  }, []),
);
