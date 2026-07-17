import type { UserConfig } from "vite";
import { PackageManagerName } from "./package-manager";

type ViteConfig = (args: {
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
    hosting?: {
      [identifier: string]: string[];
    };
  };
}

export interface FiredeckConfig {
  packageManager: {
    name: `${PackageManagerName}`;
    version: string;
  };
  vite?: ViteConfig;
  firebase?: {
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
  };
}
