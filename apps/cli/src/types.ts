export type ModuleComponents = "all" | "client" | "server";
export type OutputNode = { content: string; extension?: string };
export type OutputHierarchy = { [path: string]: OutputNode };

export interface Workspace {
  clients: {
    name: string;
    routes: {
      urlPath: string;
      importPath: string;
    }[];
  }[];
}

export type WorkspaceEvent =
  | { type: "module-added"; moduleName: string }
  | { type: "module-removed"; moduleName: string }
  | { type: "module-renamed"; moduleName: string; oldModuleName: string }
  | { type: "module-component-added"; moduleName: string; component: "client" | "server" }
  | { type: "module-component-removed"; moduleName: string; component: "client" | "server" }
  | { type: "route-added"; moduleName: string; routePath: string }
  | { type: "route-removed"; moduleName: string; routePath: string }
  | { type: "route-renamed"; moduleName: string; routePath: string; oldRoutePath: string };
