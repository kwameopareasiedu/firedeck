import type { UserConfig as ViteModuleConfig } from "vite";
import { PackageManagerName } from "./package-manager";

export interface FirestoreIndex {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: { fieldPath: string; order?: "ASCENDING" | "DESCENDING" }[];
}

export interface PackageManagerConfig {
  name: `${PackageManagerName}`;
  version: string;
}

export type ViteConfig =
  | ((args: {
      mode: "dev" | "build";
      moduleName: string;
      env: Record<string, string | undefined>;
    }) => Promise<ViteModuleConfig>)
  | ViteModuleConfig;

export interface FirebaseConfig {
  projects: Record<string, [string, string]>;
  firestore?: { indexes?: FirestoreIndex[]; rules?: string };
  storage?: { rules?: string };
}

export interface FiredeckUserConfig {
  packageManager: PackageManagerConfig;
  vite?: ViteConfig;
  firebase?: FirebaseConfig;
}

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  storageBucket: string;
  apiKey: string;
  authDomain: string;
  messagingSenderId: string;
  measurementId: string;
  projectNumber: string;
  version: string;
}

export interface FirebaseHostingSiteConfig {
  siteId: string;
}

export interface ModuleFirebaseConfig {
  app: FirebaseAppConfig;
  hosting: FirebaseHostingSiteConfig;
}

export interface FiredeckResolvedConfig {
  packageManager: PackageManagerConfig;
  vite: { modules: Record<string, ViteModuleConfig> };
  firebase: {
    project: { id: string; alias: string };
    modules: Record<string, ModuleFirebaseConfig>;
    firestore: { indexes: FirestoreIndex[]; rules: string };
    storage: { rules: string };
  };
}
