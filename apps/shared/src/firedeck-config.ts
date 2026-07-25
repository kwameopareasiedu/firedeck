import type { UserConfig } from "vite";
import { PackageManagerName } from "./package-manager";

export type ViteConfigBuilder = (args: {
  moduleName: string;
  viteMode: "development" | "production";
  env: Record<string, string>;
}) => Promise<UserConfig>;

export interface FirestoreIndex {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: { fieldPath: string; order?: "ASCENDING" | "DESCENDING" }[];
}

export interface FirebaseApp {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface FirebaseHostingSite {
  siteId: string;
}

export interface FirebaseFirestoreConfig {
  indexes: FirestoreIndex[];
  /** Firestore security rules string (copy-paste from Firebase console) */
  rules: string;
}

export interface FirebaseStorageConfig {
  /** Storage security rules string (copy-paste from Firebase console) */
  rules: string;
}

export interface FirebaseProject {
  /** Project id on Firebase console */
  projectId: string;
  /** Map of **client module names** to {@link FirebaseApp}s */
  apps: Record<string, FirebaseApp>;
  /** Map of **client module names** to {@link FirebaseHostingSite}s */
  hosting: Record<string, FirebaseHostingSite>;
  /** Firestore configuration */
  firestore: FirebaseFirestoreConfig;
  /** Storage configuration */
  storage: FirebaseStorageConfig;
}

export interface FirebaseConfig {
  /** Map of Firebase **project aliases** to {@link FirebaseProject}s */
  projects: Record<string, FirebaseProject>;
}

export interface FiredeckConfig {
  packageManager: {
    name: `${PackageManagerName}`;
    version: string;
  };
  vite?: ViteConfigBuilder;
  firebase?: FirebaseConfig;
}
