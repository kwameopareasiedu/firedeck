import { assertFiredeckRootDir, error, getProjectPaths, info } from "@/utils";
import { relative, resolve } from "node:path";
import fs from "fs-extra";
import { spawn } from "node:child_process";
import kill from "tree-kill";
import chokidar from "chokidar";
import { compileProject } from "@/compile-project";
import { getFiredeckConfig } from "@/analyze-project";
import { packageManagers } from "shared/package-manager";
import { CompileProjectOptions, ProjectMutation } from "@/types";

/** Starts a file watcher service and orchestrator thread to run a Firedeck project */
export async function runProject(rootDir: string, opts?: CompileProjectOptions) {
  assertFiredeckRootDir(rootDir);

  const { configFile, modulesDir, runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await getFiredeckConfig(rootDir);
  const packageManager = packageManagers[firedeckConfig.packageManager.name];

  let [currentProjectModel] = await compileProject(rootDir, null, opts);

  for (const lockFileName of packageManager.lockFiles) {
    const lockFilePath = resolve(rootDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const destPath = resolve(runtimeDir, lockFileName);
      fs.copyFileSync(lockFilePath, destPath);
      break;
    }
  }

  const cmd = `${packageManager.commands.run} dev`;
  const cmdName = cmd.split(" ")[0];
  const cmdOpts = cmd.split(" ").slice(1);
  let runtimeDevProc = spawn(cmdName, cmdOpts, { cwd: runtimeDir, stdio: "inherit" });
  let changeDebounceTimer: NodeJS.Timeout | null = null;

  const handleChange = async (path: string, eventName: string) => {
    if (stopping) return;

    if (changeDebounceTimer) clearTimeout(changeDebounceTimer);

    changeDebounceTimer = setTimeout(async () => {
      try {
        info(`${eventName}: ${relative(modulesDir, path)}`);
        const [newProjectModel, projectMutations] = await compileProject(
          rootDir,
          currentProjectModel,
          opts,
        );
        currentProjectModel = newProjectModel;

        const restartRuntimeDevProc = projectMutations.some((change) => {
          return (
            [
              "update-runtime",
              "add-runtime-client",
              "rename-runtime-client",
              "update-runtime-client-env",
              "remove-runtime-client",
              "add-runtime-backend",
              "rename-runtime-backend",
              "update-runtime-backend-env",
              "remove-runtime-backend",
              "update-runtime-firebase-config",
            ] as ProjectMutation["type"][]
          ).includes(change.type);
        });

        if (restartRuntimeDevProc) {
          info("restarting runtime");

          kill(runtimeDevProc.pid!);
          await new Promise((resolve) => setTimeout(resolve, 1250));

          if (runtimeDevProc.exitCode === null) {
            kill(runtimeDevProc.pid!, "SIGKILL");
            await new Promise((resolve) => setTimeout(resolve, 1250));
          }

          runtimeDevProc = spawn(cmdName, cmdOpts, { cwd: runtimeDir, stdio: "inherit" });
        }
      } catch (err) {
        error(err);
      }
    }, 500);
  };

  const fileWatcher = chokidar
    .watch([configFile, modulesDir], {
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 500 },
    })
    .on("ready", () => info("watching modules"))
    .on("error", (err) => error(`error: ${err}`))
    .on("add", async (path) => await handleChange(path, "new-file"))
    .on("addDir", async (path) => await handleChange(path, "new-dir"))
    .on("change", async (path) => await handleChange(path, "change"))
    .on("unlink", async (path) => await handleChange(path, "delete-file"))
    .on("unlinkDir", async (path) => await handleChange(path, "delete-dir"));

  let stopping = false;

  process.on("SIGINT", async () => {
    if (!stopping) {
      stopping = true;
      info("SIGINT received; terminating runtime");
      kill(runtimeDevProc.pid!);
      await fileWatcher.close();
      await new Promise((resolve) => setTimeout(resolve, 1250));

      if (runtimeDevProc.exitCode === null) {
        kill(runtimeDevProc.pid!, "SIGKILL");
        await new Promise((resolve) => setTimeout(resolve, 1250));
      }
    } else info("runtime terminating");
  });

  info("runtime started");
}
