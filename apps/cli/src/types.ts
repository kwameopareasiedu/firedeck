export type ModuleComponents = "all" | "client" | "server";
export type OutputNode = { content: string; extension?: string };
export type OutputHierarchy = { [path: string]: OutputNode };

export interface RouteNode {
  pageImportPath: string | null;
  layoutImportPath: string | null;
  urlPath: string | null;
  children: RouteNode[];
}

export interface Workspace {
  clients: {
    name: string;
    routes: RouteNode;
  }[];
}

export type WorkspaceChange =
  | { type: "create-runtime" }
  | { type: "add-client"; clientName: string }
  | { type: "remove-client"; clientName: string }
  | { type: "rename-client"; oldClientName: string; newClientName: string }
  | { type: "update-client-routes"; clientName: string };
