import { PackageManagerName, packageManagers } from "shared/package-manager";
import fs from "fs-extra";
import { relative } from "node:path";
import { execSync } from "node:child_process";
import { generateProjectFileTree } from "@/templates";
import { writeFileTree } from "@/utils";

export async function init(
  rootDir: string,
  opts: {
    projectName: string;
    projectDescription: string;
    projectVersion: string;
    projectAuthor: string;
    packageManagerName: PackageManagerName;
  },
) {
  if (!fs.existsSync(rootDir)) {
    fs.ensureDirSync(rootDir);
  } else if (fs.readdirSync(rootDir).length !== 0) {
    throw `./${relative(process.cwd(), rootDir)}: directory is not empty`;
  }

  const packageManager = packageManagers[opts.packageManagerName];
  if (!packageManager) throw `unsupported package manager: ${opts.packageManagerName}`;

  const packageManagerVersion = execSync(packageManager.commands.checkVersion, {
    encoding: "utf-8",
  }).trim();

  if (!packageManagerVersion) throw `package manager not found: ${opts.packageManagerName}`;

  const projectFileTree = generateProjectFileTree({
    projectName: opts.projectName,
    projectDescription: opts.projectDescription,
    projectVersion: opts.projectVersion,
    projectAuthor: opts.projectAuthor,
    packageManagerName: opts.packageManagerName,
    packageManagerVersion: packageManagerVersion,
  });

  await writeFileTree(rootDir, projectFileTree);
}
