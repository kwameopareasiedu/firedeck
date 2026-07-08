type ModuleComponents = "all" | "client" | "server";

export async function createModule(args: { name: string; components?: ModuleComponents }) {
  const components: ModuleComponents = args.components || "all";
  console.log({ ...args, components });
}
