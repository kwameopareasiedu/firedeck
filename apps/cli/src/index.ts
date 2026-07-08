#!/usr/bin/env node

import fs from "fs-extra";
import { resolve } from "node:path";
import { Command } from "commander";
import { init } from "@/init";
import { createModule } from "@/module";
import { cwdIsRoot } from "@/utils";

const packageInfo = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), { encoding: "utf-8" }),
);

const cli = new Command("firedeck");
cli.description(packageInfo.description);
cli.version(packageInfo.version, "-v");

cli
  .command("init <rootDir>")
  .description("Create a new Firedeck project at the specified directory <rootDir>")
  .action(async (rootDir) => {
    const absRootDirectory = resolve(process.cwd(), rootDir);
    await init({ rootDir: absRootDirectory });
  });

const moduleCli = new Command("module");
moduleCli.description("Manages firedeck modules in the project");

moduleCli
  .command("new <name>")
  .option("--client-only", "client-only module")
  .option("--server-only", "server-only module")
  .description("Create a new Firedeck module named <name> with client and server components")
  .action(async (name, opts) => {
    if (opts.clientOnly && opts.serverOnly)
      throw new Error("--client-only and --server-only cannot be specified at the same time");

    if (!cwdIsRoot())
      throw new Error(
        "Cannot find firedeck.json. Make sure this command is run at the project root",
      );

    await createModule({
      name,
      components: opts.clientOnly ? "client" : opts.serverOnly ? "server" : undefined,
    });
  });

cli.addCommand(moduleCli);

cli.parse(process.argv);
