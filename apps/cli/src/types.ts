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

export type WorkspaceChange =
  | { type: "client-added"; clientName: string }
  | { type: "client-removed"; clientName: string }
  | { type: "client-renamed"; oldClientName: string; newClientName: string }
  | { type: "client-routes-modified"; clientName: string };
