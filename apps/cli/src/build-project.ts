import { assertFiredeckRootDir, error, getProjectPaths, info } from "@/utils";
import { parseFiredeckConfig } from "@/analyze-project";
import { packageManagers } from "shared/package-manager";
import { relative, resolve } from "node:path";
import fs from "fs-extra";
import { compileProject } from "@/compile-project";
import { exec } from "node:child_process";

export async function buildProject(
  rootDir: string,
  opts: { log: typeof info; error: typeof error },
) {
  assertFiredeckRootDir(rootDir);

  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await parseFiredeckConfig(rootDir);
  const packageManager = packageManagers[firedeckConfig.packageManager.name];

  for (const lockFileName of packageManager.lockFile) {
    const lockFilePath = resolve(rootDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const destPath = resolve(runtimeDir, lockFileName);
      fs.copyFileSync(lockFilePath, destPath);
      break;
    }
  }

  const [projectModel] = await compileProject(rootDir);

  const runtimeBuildProc = exec("yarn build", { cwd: runtimeDir });
  runtimeBuildProc.stdout?.on("data", console.log);
  runtimeBuildProc.stderr?.on("error", console.error);
  runtimeBuildProc.on("error", opts.error);
  runtimeBuildProc.on("close", (exitCode) => {
    if (exitCode !== 0) {
      opts.error("build failed");
    } else {
      const msg = projectModel.clients.reduce((msg, client) => {
        const clientDist = `${runtimeDir}/modules/${client.name}/dist`;
        return msg + `${client.name}: ${relative(rootDir, clientDist)}\n`;
      }, "");

      opts.log("build complete\n" + msg);
    }
  });
}
