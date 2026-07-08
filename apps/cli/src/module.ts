import { generateModuleContents } from "@/templates";
import { writeFileContents } from "@/utils";

type ModuleComponents = "all" | "client" | "server";

export async function createModule(args: { name: string; components?: ModuleComponents }) {
  const components: ModuleComponents = args.components || "all";
  const moduleContents = generateModuleContents({ name: args.name, components: components });
  const projectRoot = process.cwd();

  await writeFileContents(moduleContents, projectRoot);
}
