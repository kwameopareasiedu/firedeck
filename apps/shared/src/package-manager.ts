interface PackageManager {
  name: string;
  commands: {
    runScript: string;
    checkVersion: string;
  };
  lockFile: [string];
}

export enum PackageManagerName {
  NPM = "npm",
  YARN = "yarn",
}

export const packageManagers: Record<PackageManagerName, PackageManager> = {
  [PackageManagerName.YARN]: {
    name: "Yarn",
    commands: {
      runScript: "yarn",
      checkVersion: "yarn -v",
    },
    lockFile: ["yarn.lock"],
  },
  [PackageManagerName.NPM]: {
    name: "NPM",
    commands: {
      runScript: "npm run",
      checkVersion: "npm -v",
    },
    lockFile: ["package-lock.json"],
  },
};
