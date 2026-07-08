export type ModuleComponents = "all" | "client" | "server";
export type PathProperty = { content: string; extension?: string };
export type TemplatePaths = { [path: string]: PathProperty };
export interface RouteConfig {
  path: string;
  importPath: string;
}

export interface ClientApplication {
  routes: RouteConfig[];
}
