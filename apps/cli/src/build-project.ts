import { assertFiredeckRootDir, getProjectPaths, info } from "@/utils";
import { parseFiredeckConfig } from "@/analyze-project";
import { packageManagers } from "shared/package-manager";
import { relative, resolve } from "node:path";
import fs from "fs-extra";
import { compileProject } from "@/compile-project";
import { spawn } from "node:child_process";

export async function buildProject(rootDir: string, explain?: boolean) {
  assertFiredeckRootDir(rootDir);

  const [projectModel] = await compileProject(rootDir, null, explain);

  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await parseFiredeckConfig(rootDir);
  const packageManager = packageManagers[firedeckConfig.packageManager.name];

  for (const lockFileName of packageManager.lockFiles) {
    const lockFilePath = resolve(rootDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const destPath = resolve(runtimeDir, lockFileName);
      fs.copyFileSync(lockFilePath, destPath);
      break;
    }
  }

  return new Promise((resolve, reject) => {
    spawn(packageManager.commands.run, ["build"], { cwd: runtimeDir, stdio: "inherit" })
      .on("error", (err) => reject(err))
      .on("exit", (exitCode) => {
        if (exitCode === 0) {
          for (const client of projectModel.clients) {
            const clientDist = `${runtimeDir}/modules/${client.name}/dist`;
            info(`built client module (${client.name}): ${relative(rootDir, clientDist)}`);
          }
          resolve(null);
        } else {
          reject(new Error("build failed"));
        }
      });
  });
}
