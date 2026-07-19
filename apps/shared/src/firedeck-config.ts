import type { UserConfig } from "vite";
import { PackageManagerName } from "./package-manager";

type ConfigBuilder<A, R> = (args: A) => R;

export type ViteConfigBuilder = ConfigBuilder<
  { moduleName: string; viteMode: "development" | "production"; env: Record<string, string> },
  Promise<UserConfig>
>;

export interface FirestoreIndex {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: { fieldPath: string; order?: "ASCENDING" | "DESCENDING" }[];
}

export type ClientModuleFirebaseConfigBuilder = ConfigBuilder<
  { moduleName: string },
  { hostingSiteName: string }
>;

export type BackendModuleFirebaseConfigBuilder = ConfigBuilder<
  { moduleName: string },
  { webAppName: string }
>;

export interface FirebaseProjectConfig {
  projectId: string;
  modules?: {
    client?: ClientModuleFirebaseConfigBuilder;
    backend?: BackendModuleFirebaseConfigBuilder;
  };
  firestore?: {
    indexes?: FirestoreIndex[];
    rules?: string;
  };
  storage?: {
    rules?: string;
  };
}

export interface FirebaseConfig {
  projects: {
    [alias: string]: FirebaseProjectConfig;
  };
}

export interface FiredeckConfig {
  packageManager: {
    name: `${PackageManagerName}`;
    version: string;
  };
  vite?: ViteConfigBuilder;
  firebase?: FirebaseConfig;
}
