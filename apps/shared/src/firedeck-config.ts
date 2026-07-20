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

export interface FirebaseHostingConfig {
  siteId: string;
}

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface FirebaseProjectConfig {
  projectId: string;
  projectAlias: string;
  apps: (args: { moduleName: string }) => FirebaseAppConfig;
  hosting: (args: { moduleName: string }) => FirebaseHostingConfig;
  firestore?: { indexes?: FirestoreIndex[]; rules?: string };
  storage?: { rules?: string };
}

export interface FirebaseConfig {
  projects: FirebaseProjectConfig[];
}

export interface FiredeckConfig {
  packageManager: {
    name: `${PackageManagerName}`;
    version: string;
  };
  vite?: ViteConfigBuilder;
  firebase?: FirebaseConfig;
}
