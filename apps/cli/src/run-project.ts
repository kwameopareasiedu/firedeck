import { assertFiredeckRootDir, error, getProjectPaths, info } from "@/utils";
import { relative, resolve } from "node:path";
import fs from "fs-extra";
import { spawn } from "node:child_process";
import kill from "tree-kill";
import chokidar from "chokidar";
import { compileProject } from "@/compile-project";
import { parseFiredeckConfig } from "@/analyze-project";
import { packageManagers } from "shared/package-manager";
import { ProjectMutation } from "@/types";

export async function runProject(rootDir: string, opts: { log: typeof info; error: typeof error }) {
  assertFiredeckRootDir(rootDir);

  const { configFile, modulesDir, runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await parseFiredeckConfig(rootDir);
  const packageManager = packageManagers[firedeckConfig.packageManager.name];

  let [projectModel] = await compileProject(rootDir, null);

  for (const lockFileName of packageManager.lockFiles) {
    const lockFilePath = resolve(rootDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const destPath = resolve(runtimeDir, lockFileName);
      fs.copyFileSync(lockFilePath, destPath);
      break;
    }
  }

  const cmd = `${packageManager.commands.runScript} dev`;
  const cmdName = cmd.split(" ")[0];
  const cmdOpts = cmd.split(" ").slice(1);
  let runtimeDevProc = spawn(cmdName, cmdOpts, { cwd: runtimeDir, stdio: "inherit" });
  let changeDebounceTimer: NodeJS.Timeout | null = null;

  const handleChange = async (path: string, eventName: string) => {
    if (stopping) return;

    if (changeDebounceTimer) clearTimeout(changeDebounceTimer);

    changeDebounceTimer = setTimeout(async () => {
      try {
        opts.log(`${eventName}: ${relative(modulesDir, path)}`);
        const [updatedProjectModel, projectMutations] = await compileProject(rootDir, projectModel);
        projectModel = updatedProjectModel;

        const restartRuntimeDevProc = projectMutations.some((change) =>
          (
            [
              "add-runtime-client",
              "remove-runtime-client",
              "rename-runtime-client",
              "update-runtime-client-env",
              "update-runtime-client-config",
            ] as ProjectMutation["type"][]
          ).includes(change.type),
        );

        if (restartRuntimeDevProc) {
          kill(runtimeDevProc.pid!);
          await new Promise((resolve) => setTimeout(resolve, 1250));

          if (runtimeDevProc.exitCode === null) {
            kill(runtimeDevProc.pid!, "SIGKILL");
            await new Promise((resolve) => setTimeout(resolve, 1250));
          }

          runtimeDevProc = spawn(cmdName, cmdOpts, { cwd: runtimeDir, stdio: "inherit" });
        }
      } catch (err) {
        opts.error(err);
      }
    }, 500);
  };

  const fileWatcher = chokidar
    .watch([configFile, modulesDir], {
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 500 },
    })
    .on("ready", () => opts.log("watching modules"))
    .on("error", (err) => opts.error(`error: ${err}`))
    .on("add", async (path) => await handleChange(path, "new-file"))
    .on("addDir", async (path) => await handleChange(path, "new-dir"))
    .on("change", async (path) => await handleChange(path, "change"))
    .on("unlink", async (path) => await handleChange(path, "delete-file"))
    .on("unlinkDir", async (path) => await handleChange(path, "delete-dir"));

  let stopping = false;

  process.on("SIGINT", async () => {
    if (!stopping) {
      stopping = true;
      opts.log("SIGINT received; terminating runtime");
      kill(runtimeDevProc.pid!);
      await fileWatcher.close();
      await new Promise((resolve) => setTimeout(resolve, 1250));

      if (runtimeDevProc.exitCode === null) {
        kill(runtimeDevProc.pid!, "SIGKILL");
        await new Promise((resolve) => setTimeout(resolve, 1250));
      }
    } else opts.log("runtime terminating");
  });

  opts.log("runtime started");
}
