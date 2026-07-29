import {
  assertFiredeckRootDir,
  FiredeckMode,
  getProjectPaths,
  info,
  runFirebaseCmd,
} from "@/utils";
import { analyzeProject } from "@/analyze-project";
import { buildProject } from "@/build-project";
import { BackendModuleFunction } from "@/types";

interface FirebaseUser {
  email: string;
}

interface FirebaseProject {
  projectId: string;
  displayName: string;
  name: string;
}

const DEFAULT_FUNCTION_BATCH_SIZE = 25;

/** Builds and deploys a Firedeck project to Firebase using the global `firebase` command */
export async function deployProject(
  rootDir: string,
  opts?: {
    firebaseProjectAlias?: string;
    functionsBatchSize?: number | null;
    build?: boolean;
    dryRun?: boolean;
  },
) {
  assertFiredeckRootDir(rootDir);

  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckProject = await analyzeProject(rootDir, FiredeckMode.BUILD, opts);

  const localFirebaseProject = await (async () => {
    if (firedeckProject.config.firebase.project.demo)
      throw `cannot deploy using a demo firebase project alias: ${opts?.firebaseProjectAlias}`;
    return firedeckProject.config.firebase.project;
  })();

  const remoteFirebaseAuthUser = (() => {
    const res = runFirebaseCmd<{ user: FirebaseUser }[]>("login:list", localFirebaseProject.id);
    if (!res?.[0]) throw 'run "firebase login" to sign into firebase first';
    return res[0].user;
  })();

  info(`firebase user: ${remoteFirebaseAuthUser.email}\n`);

  const remoteFirebaseProjects = runFirebaseCmd<FirebaseProject[]>(
    "projects:list",
    localFirebaseProject.id,
  );
  if (!remoteFirebaseProjects?.find((p) => p.projectId === localFirebaseProject.id))
    throw `firebase project not found: ${localFirebaseProject.id}`;

  info(`firebase project: ${localFirebaseProject.id} (${localFirebaseProject.alias})\n`);

  if (opts?.build ?? true) await buildProject(rootDir, opts);

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
