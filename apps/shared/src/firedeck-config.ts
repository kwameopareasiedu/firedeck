import type { UserConfig } from "vite";
import { PackageManagerName } from "./package-manager";

type ViteConfig = (args: {
  module: string;
  mode: "development" | "production";
  env: Record<string, string>;
}) => Promise<UserConfig>;

interface FirestoreIndex {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: { fieldPath: string; order?: "ASCENDING" | "DESCENDING" }[];
}

interface FirebaseProject {
  id: string;
  targets?: {
    hosting?: "auto" | { [identifier: string]: string[] };
  };
}

interface FirebaseConfig {
  projects: {
    [alias: string]: FirebaseProject;
  };
  firestore?: {
    indexes?: FirestoreIndex[];
    rules: string;
  };
  storage?: {
    rules: string;
  };
}

export interface FiredeckConfig {
  packageManager: {
    name: `${PackageManagerName}`;
    version: string;
  };
  vite?: ViteConfig;
  firebase?: FirebaseConfig;
}
