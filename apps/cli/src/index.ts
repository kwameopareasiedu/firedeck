#!/usr/bin/env node

import fs from "fs-extra";
import { isAbsolute, resolve } from "node:path";
import { Command } from "commander";
import { cwdIsRoot, parseErrorMessage } from "@/utils";
import { createModule, createRuntime, init } from "@/functions";
import { input } from "@inquirer/prompts";

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

      console.log(
        `
███████╗ ██╗ ██████╗  ███████╗ ██████╗  ███████╗  ██████╗ ██╗  ██╗
██╔════╝ ██║ ██╔══██╗ ██╔════╝ ██╔══██╗ ██╔════╝ ██╔════╝ ██║ ██╔╝
█████╗   ██║ ██████╔╝ █████╗   ██║  ██║ █████╗   ██║      █████╔╝ 
██╔══╝   ██║ ██╔══██╗ ██╔══╝   ██║  ██║ ██╔══╝   ██║      ██╔═██╗ 
██║      ██║ ██║  ██║ ███████╗ ██████╔╝ ███████╗ ╚██████╗ ██║  ██╗
╚═╝      ╚═╝ ╚═╝  ╚═╝ ╚══════╝ ╚═════╝  ╚══════╝  ╚═════╝ ╚═╝  ╚═╝`,
      );

      const projectName = await input({
        message: "Name:",
        default: "new-project",
        pattern: /^[a-z0-9-_]{1,214}$/,
      });
      const projectDescription = await input({
        message: "Description:",
        default: "A fun little test project",
      });
      const projectVersion = await input({ message: "Version:", default: "0.1.0" });
      const projectAuthor = await input({ message: "Author:", default: "Kwame" });

      await init({ rootDir, projectName, projectDescription, projectVersion, projectAuthor });
    } catch (err) {
      console.error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli.command("run").action(async () => {
  if (!cwdIsRoot())
    throw "cannot find 'firedeck.json'. make sure this command is run at the project root";

  await createRuntime({ rootDir: process.cwd() });
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

cli.addCommand(moduleCli);

cli.parse(process.argv);
