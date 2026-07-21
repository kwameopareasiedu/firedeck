import {
  assertFiredeckRootDir,
  demoFirebaseProject,
  error,
  getProjectPaths,
  info,
  warn,
} from "@/utils";
import { analyzeProject, getFiredeckConfig } from "@/analyze-project";
import { execSync } from "node:child_process";
import { buildProject } from "@/build-project";
import fs from "fs-extra";
import { CompileProjectOptions, NestedArray, NestedRecord } from "@/types";

/** Builds and deploys a Firedeck project to Firebase using the global `firebase` command */
export async function deployProject(rootDir: string, opts?: CompileProjectOptions) {
  assertFiredeckRootDir(rootDir);

  const alias = opts?.firebaseProjectAlias;
  const { runtimeDir, runtimeFirebaseRcFile } = getProjectPaths(rootDir);
  const firedeckConfig = await getFiredeckConfig(rootDir);
  const firebaseProjectConfigs = firedeckConfig.firebase?.projects ?? [];

  const localProjectConfig = await (async () => {
    const aliasProjectConfig = alias
      ? firebaseProjectConfigs.find((project) => project.projectAlias === alias)
      : demoFirebaseProject;

    if (!aliasProjectConfig) throw `invalid firebase project alias: ${alias}`;
    if (aliasProjectConfig.projectId.toLowerCase().startsWith("demo"))
      throw `cannot deploy using a demo firebase project alias: ${alias}`;

    return aliasProjectConfig;
  })();

  const firebaseAuthUser = (() => {
    const res = queryFirebase<NestedRecord>("login:list", localProjectConfig.projectId);
    if (!res?.[0]) throw 'run "firebase login" to sign into firebase first';
    return res[0].user;
  })();

  const remoteProjects = queryFirebase<NestedArray>("projects:list", localProjectConfig.projectId);
  if (!remoteProjects.find((p) => p.projectId === localProjectConfig.projectId))
    throw `firebase project not found: ${localProjectConfig.projectId}`;

  const projectModel = await analyzeProject(rootDir);
  const remoteApps = queryFirebase<NestedArray>("apps:list", localProjectConfig.projectId);
  const remoteHostingSites = queryFirebase<NestedRecord>(
    "hosting:sites:list",
    localProjectConfig.projectId,
  )?.sites as NestedArray | undefined;

  for (const client of projectModel.clients) {
    const clientLocalApp = localProjectConfig.apps({ moduleName: client.name });
    if (!clientLocalApp) throw `no configured firebase app for client module: ${client.name}`;

    const clientRemoteApp = remoteApps.find(
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

  info(`firebase user: ${firebaseAuthUser.email}`);
  info(`firebase project: ${localProjectConfig.projectId} (${alias})`);

  // await buildProject(rootDir, opts);

  //
  // const localHostingTargets = JSON.parse(
  //   fs.readFileSync(runtimeFirebaseRcFile, { encoding: "utf-8" }),
  // ).targets[localFirebaseProject.projectId].hosting;
  //
  // for (const localClientName in localHostingTargets) {
  //   const localClientHostingTargets: string[] = localHostingTargets[localClientName];
  //
  //   for (const localClientHostingTarget of localClientHostingTargets) {
  //     const localClientHostingTargetExists = firebaseHostingSites.find(
  //       (site: { name: string }) =>
  //         site.name ===
  //         `projects/${localFirebaseProject.projectId}/sites/${localClientHostingTarget}`,
  //     );
  //
  //     if (!localClientHostingTargetExists) {
  //       warn(`hosting site: missing ${localClientHostingTarget}`);
  //       info(`hosting site: creating ${localClientHostingTarget}`);
  //       const createSiteResponse = JSON.parse(
  //         execSync(
  //           `firebase hosting:sites:create ${localClientHostingTarget} --project ${localFirebaseProject.projectId} --json`,
  //           { encoding: "utf-8" },
  //         ),
  //       );
  //
  //       if (createSiteResponse.status === "error") throw createSiteResponse.error;
  //       info(`hosting site: created: ${localClientHostingTarget}`);
  //     } else {
  //       info(`hosting site: found ${localClientHostingTarget}`);
  //     }
  //   }
  // }
  //
  // execSync(`firebase deploy -f --project ${localFirebaseProject.projectId}`, {
  //   cwd: runtimeDir,
  //   stdio: "inherit",
  // });
}

function queryFirebase<T>(command: string, projectId: string) {
  const response = JSON.parse(
    execSync(`firebase ${command} --project ${projectId} --json`, { encoding: "utf-8" }),
  );

  if (response.status === "error") throw response.error;
  return response.result as T;
}
