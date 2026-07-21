import { FiredeckConfig } from "shared/firedeck-config";

export type ModuleType = "client" | "backend";
export type FileNode = { content: string; extension?: string | null };
export type FileTree = { [path: string]: FileNode };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NestedRecord = { [key: string]: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NestedArray = any[];

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

export interface ProjectModel {
  config: FiredeckConfig;
  clients: ClientModule[];
  backends: BackendModule[];
}

export type ProjectMutation =
  // Workspace mutations
  | { type: "update-workspace-env-types"; clients: ClientModule[] }
  // Runtime mutations
  | { type: "create-runtime"; config: FiredeckConfig; backends: BackendModule[] }
  | { type: "update-runtime"; config: FiredeckConfig; backends: BackendModule[] }
  | {
      type: "update-runtime-firebase-config";
      config: FiredeckConfig;
      clients: ClientModule[];
      backends: BackendModule[];
    }
  // Runtime client mutations
  | { type: "add-runtime-client"; clientName: string; backends: BackendModule[] }
  | { type: "rename-runtime-client"; oldClientName: string; newClientName: string }
  | { type: "update-runtime-client-routes"; clientName: string; clientRoutes: ClientModuleRoute }
  | { type: "update-runtime-client-html"; clientName: string; html: string }
  | { type: "update-runtime-client-env"; clientName: string; env: string }
  | { type: "update-runtime-client-public-dir"; clientName: string }
  | { type: "remove-runtime-client"; clientName: string }
  | { type: "update-runtime-clients-config"; clients: ClientModule[]; config: FiredeckConfig }
  // Runtime backend mutations
  | { type: "add-runtime-backend"; backendName: string }
  | { type: "rename-runtime-backend"; oldBackendName: string; newBackendName: string }
  | {
      type: "update-runtime-backend-functions";
      backendName: string;
      backendFunctions: BackendModuleFunction[];
    }
  | { type: "update-runtime-backend-env"; backendName: string; env: string }
  | { type: "remove-runtime-backend"; backendName: string }
  // Client SDK mutations
  | { type: "update-client-sdk-routes"; clients: ClientModule[] }
  | {
      type: "update-client-sdk-api";
      clients: ClientModule[];
      backends: BackendModule[];
      config: FiredeckConfig;
    };

export interface CompileProjectOptions {
  explain?: boolean;
  firebaseProjectAlias?: string;
}
