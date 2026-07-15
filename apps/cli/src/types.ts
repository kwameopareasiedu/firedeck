import { FiredeckConfig } from "shared/firedeck-config";

export type ModuleComponents = "all" | "client" | "server";
export type FileNode = { content: string; extension?: string };
export type FileTree = { [path: string]: FileNode };

export interface ProjectRoute {
  pageName: string | null;
  pageImportPath: string | null;
  layoutName: string | null;
  layoutImportPath: string | null;
  placeholderName: string | null;
  placeholderImportPath: string | null;
  guardName: string | null;
  guardImportPath: string | null;
  urlPath: string | null;
  children: ProjectRoute[];
}

export interface RouterRoute {
  id?: string;
  path?: string | null;
  element?: string | null;
  loader?: string | null;
  children?: RouterRoute[];
}

export interface ProjectClient {
  name: string;
  routes: ProjectRoute;
  htmlHash: number;
  envHash: number;
}

export interface ProjectModel {
  config: FiredeckConfig;
  clients: ProjectClient[];
}

export type ProjectMutation =
  | { type: "create-runtime" }
  | { type: "update-config"; config: FiredeckConfig }
  | { type: "add-runtime-client"; clientName: string }
  | { type: "remove-runtime-client"; clientName: string }
  | { type: "rename-runtime-client"; oldClientName: string; newClientName: string }
  | { type: "update-runtime-client-routes"; clientName: string; clientRoutes: ProjectRoute }
  | { type: "update-runtime-client-html"; clientName: string }
  | { type: "update-runtime-client-env"; clientName: string }
  | { type: "update-client-sdk-routes"; clients: ProjectClient[] };
