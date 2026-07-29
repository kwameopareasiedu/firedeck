import { FiredeckResolvedConfig } from "shared/firedeck-config";

export type ModuleType = "client" | "backend";
export type FileNode = { content: string; extension?: string | null };
export type FileTree = { [path: string]: FileNode };

export interface ClientModuleRoute {
  pageName: string | null;
  pageImportPath: string | null;
  layoutName: string | null;
  layoutImportPath: string | null;
  placeholderName: string | null;
  placeholderImportPath: string | null;
  beforeName: string | null;
  beforeImportPath: string | null;
  urlPath: string | null;
  children: ClientModuleRoute[];
}

export interface RouterRoute {
  id?: string;
  path?: string | null;
  lazy?: {
    Component?: string;
  };
  HydrateFallback?: string;
  loader?: string;
  children?: RouterRoute[];
}

export interface ClientModule {
  name: string;
  routes: ClientModuleRoute;
  publicLastModifiedTs: number;
  indexHtml: string;
  env: string;
}

export interface BackendModuleFunction {
  name: string;
  importPath: string;
}

export interface BackendModule {
  name: string;
  functions: BackendModuleFunction[];
  env: string;
}

export interface FiredeckProject {
  config: FiredeckResolvedConfig;
  clients: ClientModule[];
  backends: BackendModule[];
}

export type ProjectMutation =
  // Workspace mutations
  | { type: "update-workspace-env-types" }
  // Runtime mutations
  | { type: "create-runtime" }
  | { type: "update-runtime" }
  // Runtime client mutations
  | { type: "add-runtime-client"; clientName: string }
  | { type: "update-runtime-client-env"; clientName: string }
  | { type: "update-runtime-client-html"; clientName: string }
  | { type: "update-runtime-client-public-dir"; clientName: string }
  | { type: "update-runtime-client-sdk"; clientName: string }
  | { type: "rename-runtime-client"; oldName: string; newName: string }
  | { type: "remove-runtime-client"; clientName: string }
  // Runtime backend mutations
  | { type: "add-runtime-backend"; backendName: string }
  | { type: "update-runtime-backend-functions"; backendName: string }
  | { type: "update-runtime-backend-env"; backendName: string }
  | { type: "rename-runtime-backend"; oldName: string; newName: string }
  | { type: "remove-runtime-backend"; backendName: string };

export type ProjectMutationType = ProjectMutation["type"];
