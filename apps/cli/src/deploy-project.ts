import { assertFiredeckRootDir, demoFirebaseProjectConfig, getProjectPaths, info } from "@/utils";
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

  const alias = opts?.firebaseProjectAlias;
  const { runtimeDir } = getProjectPaths(rootDir);
  const firedeckConfig = await getFiredeckConfig(rootDir);
  const firebaseProjectConfigs = firedeckConfig.firebase?.projects ?? [];

  const localProjectConfig = await (async () => {
    const aliasProjectConfig = alias
      ? firebaseProjectConfigs.find((project) => project.projectAlias === alias)
      : demoFirebaseProjectConfig;

    if (!aliasProjectConfig) throw `invalid firebase project alias: ${alias}`;
    if (aliasProjectConfig.projectId.toLowerCase().startsWith("demo"))
      throw `cannot deploy using a demo firebase project alias: ${alias}`;

    return aliasProjectConfig;
  })();

  const firebaseAuthUser = (() => {
    const res = runFirebaseCmd<NestedRecord>("login:list", localProjectConfig.projectId);
    if (!res?.[0]) throw 'run "firebase login" to sign into firebase first';
    return res[0].user;
  })();

  info(`firebase user: ${firebaseAuthUser.email}\n`);

  const remoteProjects = runFirebaseCmd<NestedArray>("projects:list", localProjectConfig.projectId);
  if (!remoteProjects?.find((p) => p.projectId === localProjectConfig.projectId))
    throw `firebase project not found: ${localProjectConfig.projectId}`;

  info(`firebase project: ${localProjectConfig.projectId} (${alias})\n`);

  const projectModel = await analyzeProject(rootDir);
  const remoteApps = runFirebaseCmd<NestedArray>("apps:list", localProjectConfig.projectId);
  const remoteHostingSites = runFirebaseCmd<NestedRecord>(
    "hosting:sites:list",
    localProjectConfig.projectId,
  )?.sites as NestedArray | undefined;

  for (const client of projectModel.clients) {
    const clientLocalApp = localProjectConfig.apps({ moduleName: client.name });
    if (!clientLocalApp) throw `no configured firebase app for client module: ${client.name}`;

    const clientRemoteApp = remoteApps?.find(
      (app) => app.platform === "WEB" && app.appId === clientLocalApp.appId,
    );
    if (!clientRemoteApp) throw `no remote firebase app for client module: ${client.name}`;

    const clientLocalHostingSite = localProjectConfig.hosting({ moduleName: client.name });
    if (!clientLocalHostingSite)
      throw `no configured firebase hosting site for client module: ${client.name}`;

    const clientRemoteHostingSite = remoteHostingSites?.find((site) =>
      site.name.endsWith(clientLocalHostingSite.siteId),
    );
    if (!clientRemoteHostingSite)
      throw `no remote firebase hosting site for client module: ${client.name}`;
  }

  if (opts?.build ?? true) await buildProject(rootDir, { firebaseProjectAlias: alias });

  runFirebaseCmd(
    `deploy --except functions ${opts?.dryRun ? "--dry-run" : ""} -f`,
    localProjectConfig.projectId,
    { cwd: runtimeDir, noJson: true },
  );

  const backendFunctions = projectModel.backends.reduce(
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
      localProjectConfig.projectId,
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
