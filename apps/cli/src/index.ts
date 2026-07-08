#!/usr/bin/env node

import fs from "fs-extra";
import { resolve, isAbsolute } from "node:path";
import { Command } from "commander";
import { init } from "@/init";
import { analyzeModules, createModule } from "@/module";
import { cwdIsRoot, parseErrorMessage } from "@/utils";

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
    try {
      rootDir = isAbsolute(rootDir) ? rootDir : resolve(process.cwd(), rootDir);
      await init({ rootDir });
    } catch (err) {
      console.error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

const moduleCli = new Command("module");
moduleCli.description("Manages firedeck modules in the project");

moduleCli
  .command("new <name>")
  .option("--client-only", "client-only module")
  .option("--server-only", "server-only module")
  .description("Create a new Firedeck module named <name> with client and server components")
  .action(async (name, opts) => {
    try {
      if (opts.clientOnly && opts.serverOnly)
        throw "--client-only and --server-only cannot be specified at the same time";
      else if (!cwdIsRoot())
        throw "cannot find 'firedeck.json'. make sure this command is run at the project root";

      await createModule({
        name,
        rootDir: process.cwd(),
        components: opts.clientOnly ? "client" : opts.serverOnly ? "server" : undefined,
      });
    } catch (err) {
      console.error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

moduleCli.command("analyze").action(async () => {
  if (!cwdIsRoot())
    throw "cannot find 'firedeck.json'. make sure this command is run at the project root";

  await analyzeModules({ rootDir: process.cwd() });
});

cli.addCommand(moduleCli);

cli.parse(process.argv);
