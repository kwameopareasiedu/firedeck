import type { UserConfig } from "vite";

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
  vite?: UserConfig;
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
