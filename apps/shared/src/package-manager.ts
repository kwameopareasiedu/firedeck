interface PackageManager {
  name: string;
  commands: {
    run: string;
    checkVersion: string;
  };
  postInitSteps: string[];
  lockFiles: [string];
}

export enum PackageManagerName {
  NPM = "npm",
  YARN = "yarn",
}

export const packageManagers: Record<PackageManagerName, PackageManager> = {
  [PackageManagerName.YARN]: {
    name: "Yarn",
    commands: {
      run: "yarn",
      checkVersion: "yarn -v",
    },
    postInitSteps: ["yarn install", "yarn dev"],
    lockFiles: ["yarn.lock"],
  },
  [PackageManagerName.NPM]: {
    name: "NPM",
    commands: {
      run: "npm run",
      checkVersion: "npm -v",
    },
    postInitSteps: ["npm install", "npm run dev"],
    lockFiles: ["package-lock.json"],
  },
};
