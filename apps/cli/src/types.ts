export type ModuleComponents = "all" | "client" | "server";
export type FileNode = { content: string; extension?: string };
export type FileTree = { [path: string]: FileNode };

export interface RouteNode {
  name: string;
  pageImportPath: string | null;
  layoutImportPath: string | null;
  placeholderImportPath: string | null;
  guardImportPath: string | null;
  urlPath: string | null;
  children: RouteNode[];
}

export interface RouteNodeTarget {
  id: string;
  path?: string | null;
  element?: string | null;
  loader?: string | null;
  children?: RouteNodeTarget[];
}

export interface Workspace {
  clients: {
    name: string;
    routes: RouteNode;
    html: {
      hash: number;
    };
  }[];
}

export type WorkspaceChange =
  | { type: "create-runtime" }
  | { type: "add-client"; clientName: string }
  | { type: "remove-client"; clientName: string }
  | { type: "rename-client"; oldClientName: string; newClientName: string }
  | { type: "update-client-routes"; clientName: string; clientRoutes: RouteNode }
  | { type: "update-client-html"; clientName: string };
