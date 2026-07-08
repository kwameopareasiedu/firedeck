import { generateModuleContents } from "@/templates";
import { writeFileContents } from "@/utils";
import { relative, resolve } from "node:path";
import fs from "fs-extra";

type ModuleComponents = "all" | "client" | "server";

export async function createModule(args: { name: string; components?: ModuleComponents }) {
  const components: ModuleComponents = args.components || "all";
  const moduleContents = generateModuleContents({ name: args.name, components: components });
  const projectRoot = process.cwd();
  const modulePath = resolve(projectRoot, `modules/${args.name}`);

  if (fs.existsSync(modulePath) && fs.readdirSync(modulePath).length !== 0)
    throw `./${relative(process.cwd(), modulePath)}: directory is not empty`;

  await writeFileContents(moduleContents, projectRoot);

  console.log(`Created new module '${args.name}': ${relative(process.cwd(), modulePath)}`);
}
