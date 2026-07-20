import { assertFiredeckRootDir, getProjectPaths, info, warn } from "@/utils";
import { getFiredeckConfig } from "@/analyze-project";
import { execSync } from "node:child_process";
import { buildProject } from "@/build-project";
import fs from "fs-extra";

/** Builds and deploys a Firedeck project to Firebase using the global `firebase` command */
export async function deployProject(rootDir: string, opts: { alias?: string; build?: boolean }) {
  assertFiredeckRootDir(rootDir);

  if (opts.build) await buildProject(rootDir);

  let alias = opts?.alias;
  const { runtimeDir, runtimeFirebaseRcFile } = getProjectPaths(rootDir);
  const firedeckConfig = await getFiredeckConfig(rootDir);

  const localFirebaseProject = (() => {
    const localFirebaseProjects = firedeckConfig.firebase?.projects;
    if (!localFirebaseProjects) throw "no firebase projects aliases in firedeck.config.ts";

    const localAliases = Object.keys(localFirebaseProjects);

    if (localAliases.length === 0) {
      throw "no firebase projects aliases in firedeck.config.ts";
    } else if (localAliases.length === 1) {
      alias ??= localAliases[0];

      if (!localFirebaseProjects[alias]) throw `no firebase project with alias: ${alias}`;
      return localFirebaseProjects[alias];
    } else {
      if (!alias) throw `multiple aliases detected ${localAliases} but --alias not provided`;
      if (!localFirebaseProjects[alias]) throw `no firebase project with alias: ${alias}`;
      return localFirebaseProjects[alias];
    }
  })();

  if (localFirebaseProject.projectId.toLowerCase().startsWith("demo")) {
    return warn("deployment halted: cannot deploy using a demo firebase id");
  }

  const firebaseLogins = JSON.parse(
    execSync("firebase login:list --json", { encoding: "utf-8" }),
  )?.result;
  if (!firebaseLogins?.[0]) throw 'run "firebase login" to sign into firebase first and try again';

  const firebaseUser = firebaseLogins[0].user;
  info(`deploying using firebase user: ${firebaseUser.email}`);
  info(`deploying to firebase project: ${localFirebaseProject.projectId} (${alias})`);

  const firebaseHostingSites = JSON.parse(
    execSync(`firebase hosting:sites:list --project ${localFirebaseProject.projectId} --json`, {
      encoding: "utf-8",
    }),
  )?.result.sites;

  const localHostingTargets = JSON.parse(
    fs.readFileSync(runtimeFirebaseRcFile, { encoding: "utf-8" }),
  ).targets[localFirebaseProject.projectId].hosting;

  for (const localClientName in localHostingTargets) {
    const localClientHostingTargets: string[] = localHostingTargets[localClientName];

    for (const localClientHostingTarget of localClientHostingTargets) {
      const localClientHostingTargetExists = firebaseHostingSites.find(
        (site: { name: string }) =>
          site.name ===
          `projects/${localFirebaseProject.projectId}/sites/${localClientHostingTarget}`,
      );

      if (!localClientHostingTargetExists) {
        warn(`hosting site: missing ${localClientHostingTarget}`);
        info(`hosting site: creating ${localClientHostingTarget}`);
        const createSiteResponse = JSON.parse(
          execSync(
            `firebase hosting:sites:create ${localClientHostingTarget} --project ${localFirebaseProject.projectId} --json`,
            { encoding: "utf-8" },
          ),
        );

        if (createSiteResponse.status === "error") throw createSiteResponse.error;
        info(`hosting site: created: ${localClientHostingTarget}`);
      } else {
        info(`hosting site: found ${localClientHostingTarget}`);
      }
    }
  }

  execSync(`firebase deploy -f --project ${localFirebaseProject.projectId}`, {
    cwd: runtimeDir,
    stdio: "inherit",
  });
}
