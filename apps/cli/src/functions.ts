import fs from "fs-extra";
import { relative, resolve } from "node:path";
import { pathIsFiredeckRoot } from "@/utils";
import * as walk from "acorn-walk";
// @ts-expect-error declaration don't exist
import * as walkJsx from "acorn-jsx-walk";
import chokidar from "chokidar";
import { spawn } from "node:child_process";

walkJsx.extend(walk.base);

export async function run(args: { rootDir: string }) {
  if (!pathIsFiredeckRoot(args.rootDir))
    throw `${args.rootDir}: directory is not a valid Firedeck project`;

  const runtimeRoot = resolve(args.rootDir, ".firedeck/runtime");
  const modulesRoot = resolve(args.rootDir, "modules");
  const extensions = ["html", "css", "ts", "tsx", "js", "jsx"];
  let stopping = false;

  // await compile({ rootDir: args.rootDir });

  const lockFileNames = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lock",
    "bun.lockb",
    "deno.lock",
  ];

  for (const lockFileName of lockFileNames) {
    const lockFilePath = resolve(args.rootDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const destPath = resolve(runtimeRoot, lockFileName);
      fs.copyFileSync(lockFilePath, destPath);
      break;
    }
  }

  console.log("firedeck: starting runtime");
  const devProc = spawn("yarn", ["dev"], {
    cwd: runtimeRoot,
    stdio: "inherit",
  });

  const watcher = chokidar
    .watch(modulesRoot, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
      },
    })
    .on("ready", () =>
      console.log(`firedeck: watching files at ${relative(args.rootDir, modulesRoot)}`),
    )
    .on("error", (err) => console.error(err))
    .on("change", (path) => {
      const modulesRelativePath = relative(modulesRoot, path);
      console.log(`${modulesRelativePath} changed`);
    });

  process.on("SIGINT", async () => {
    if (!stopping) {
      stopping = true;
      console.log("firedeck: SIGINT received; terminating runtime");
      devProc.kill("SIGINT");
      await watcher.close();
      await new Promise((resolve) => setTimeout(resolve, 750));
    } else console.log("firedeck: runtime terminating");
  });

  console.log("firedeck: runtime started");
}
