import { assertFiredeckRootDir, getProjectPaths, info, runFirebaseCmd } from "@/utils";
import { buildProject } from "@/build-project";
import { BackendModuleFunction } from "@/types";

const DEFAULT_FUNCTION_BATCH_SIZE = 25;

/** Builds and deploys a Firedeck project to Firebase using the global `firebase` command */
export async function deployProject(
  rootDir: string,
  opts?: { firebaseProjectAlias?: string; functionsBatchSize?: number | null; dryRun?: boolean },
) {
  assertFiredeckRootDir(rootDir);
  info("deployment started!");

  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckProject = await buildProject(rootDir, opts);

  const localFirebaseProject = await (async () => {
    if (firedeckProject.config.firebase.project.demo)
      throw `cannot deploy using a demo firebase project alias: ${opts?.firebaseProjectAlias}`;
    return firedeckProject.config.firebase.project;
  })();

  runFirebaseCmd(
    `deploy --except functions ${opts?.dryRun ? "--dry-run" : ""} -f`,
    localFirebaseProject.id,
    { cwd: runtimeDir, noJson: true },
  );

  const backendFunctions = firedeckProject.backends.reduce(
    (fns, backend) => [...fns, ...backend.functions.map((fn) => ({ ...fn, module: backend.name }))],
    [] as (BackendModuleFunction & { module: string })[],
  );

  const functionBatchSize = opts?.functionsBatchSize || DEFAULT_FUNCTION_BATCH_SIZE;
  const functionBatchCount = Math.ceil(backendFunctions.length / functionBatchSize);

  for (let idx = 0; idx < functionBatchCount; idx++) {
    const startIndex = idx * functionBatchSize;
    const endIndex = Math.min(startIndex + functionBatchSize, backendFunctions.length);

    const batchFunctions = backendFunctions.slice(startIndex, endIndex);
    const functionDeployCommands = batchFunctions
      .map((fn) => `functions:${fn.module}:${fn.name}`)
      .join(",");

    runFirebaseCmd(
      `deploy --only ${functionDeployCommands} ${opts?.dryRun ? "--dry-run" : ""} -f`,
      localFirebaseProject.id,
      { cwd: runtimeDir, noJson: true },
    );
  }

  info("deployment complete!");
}
