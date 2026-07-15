import { ModuleComponents } from "@/types";
import { relative, resolve } from "node:path";
import fs from "fs-extra";
import { generateModuleFileTree } from "@/templates";
import { assertFiredeckRootDir, getProjectPaths, writeFileTree } from "@/utils";

export async function createModule(
  rootDir: string,
  opts: {
    moduleName: string;
    components?: ModuleComponents;
  },
) {
  assertFiredeckRootDir(rootDir);

  const { modulesDir } = getProjectPaths(rootDir);
  const moduleDir = resolve(modulesDir, opts.moduleName);

  if (fs.existsSync(moduleDir) && fs.readdirSync(moduleDir).length !== 0)
    throw `${relative(rootDir, moduleDir)}: directory is not empty`;

  const components: ModuleComponents = opts.components || "all";
  const moduleFileTree = generateModuleFileTree({
    name: opts.moduleName,
    components: components,
  });

  await writeFileTree(rootDir, moduleFileTree);

  return moduleDir;
}
