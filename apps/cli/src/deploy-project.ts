import { assertFiredeckRootDir, DEMO_FIREBASE_PROJECT_ALIAS, getProjectPaths, info } from "@/utils";
import { analyzeProject, getFiredeckConfig } from "@/analyze-project";
import { execSync } from "node:child_process";
import { buildProject } from "@/build-project";
import { BackendModuleFunction, CompileProjectOptions, NestedArray, NestedRecord } from "@/types";

const DEFAULT_FUNCTION_BATCH_SIZE = 25;

interface DeployProjectOptions extends CompileProjectOptions {
  functionsBatchSize?: number | null;
  build?: boolean;
  dryRun?: boolean;
}

/** Builds and deploys a Firedeck project to Firebase using the global `firebase` command */
export async function deployProject(rootDir: string, opts?: DeployProjectOptions) {
  assertFiredeckRootDir(rootDir);

  const alias = opts?.firebaseProjectAlias ?? DEMO_FIREBASE_PROJECT_ALIAS;
  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await getFiredeckConfig(rootDir);

  const localFirebaseProject = await (async () => {
    const firebaseProjects = firedeckConfig.firebase?.projects[alias];

    if (!firebaseProjects) throw `invalid firebase project alias: ${alias}`;
    if (firebaseProjects.projectId.toLowerCase().startsWith("demo"))
      throw `cannot deploy using a demo firebase project alias: ${alias}`;

    return firebaseProjects;
  })();

  const remoteFirebaseAuthUser = (() => {
    const res = runFirebaseCmd<NestedRecord>("login:list", localFirebaseProject.projectId);
    if (!res?.[0]) throw 'run "firebase login" to sign into firebase first';
    return res[0].user;
  })();

  info(`firebase user: ${remoteFirebaseAuthUser.email}\n`);

  const remoteFirebaseProjects = runFirebaseCmd<NestedArray>(
    "projects:list",
    localFirebaseProject.projectId,
  );
  if (!remoteFirebaseProjects?.find((p) => p.projectId === localFirebaseProject.projectId))
    throw `firebase project not found: ${localFirebaseProject.projectId}`;

  info(`firebase project: ${localFirebaseProject.projectId} (${alias})\n`);

  const remoteFirebaseApps = runFirebaseCmd<NestedArray>(
    "apps:list",
    localFirebaseProject.projectId,
  );

  const remoteFirebaseHostingSites = runFirebaseCmd<NestedRecord>(
    "hosting:sites:list",
    localFirebaseProject.projectId,
  )?.sites as NestedArray | undefined;

  const firedeckProject = await analyzeProject(rootDir, {
    firebaseProjectAlias: opts?.firebaseProjectAlias,
  });

  for (const client of firedeckProject.clients) {
    const clientLocalFirebaseApp = localFirebaseProject.apps[client.name];
    if (!clientLocalFirebaseApp)
      throw `no configured firebase app for client module: ${client.name}`;

    const clientRemoteFirebaseApp = remoteFirebaseApps?.find(
      (app) => app.platform === "WEB" && app.appId === clientLocalFirebaseApp.appId,
    );
    if (!clientRemoteFirebaseApp) throw `no remote firebase app for client module: ${client.name}`;

    const clientLocalHostingSite = localFirebaseProject.hosting[client.name];
    if (!clientLocalHostingSite)
      throw `no configured firebase hosting site for client module: ${client.name}`;

    const clientRemoteHostingSite = remoteFirebaseHostingSites?.find((site) =>
      site.name.endsWith(clientLocalHostingSite.siteId),
    );
    if (!clientRemoteHostingSite)
      throw `no remote firebase hosting site for client module: ${client.name}`;
  }

  if (opts?.build ?? true) await buildProject(rootDir, { firebaseProjectAlias: alias });

  runFirebaseCmd(
    `deploy --except functions ${opts?.dryRun ? "--dry-run" : ""} -f`,
    localFirebaseProject.projectId,
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
      localFirebaseProject.projectId,
      { cwd: runtimeDir, noJson: true },
    );
  }

  info("deployment complete!");
}

function runFirebaseCmd<T>(
  command: string,
  projectId: string,
  opts?: { cwd?: string; noJson?: boolean },
) {
  let fullCommand = `firebase ${command} --project ${projectId}`;
  if (!opts?.noJson) fullCommand += " --json";

  info(fullCommand);

  if (opts?.noJson) {
    execSync(fullCommand, { cwd: opts?.cwd, stdio: "inherit" });
    return;
  } else {
    const response = execSync(fullCommand, { cwd: opts?.cwd, encoding: "utf-8" });
    const parsedResponse = JSON.parse(response);

    if (parsedResponse.status === "error") throw parsedResponse.error;
    return parsedResponse.result as T;
  }
}
