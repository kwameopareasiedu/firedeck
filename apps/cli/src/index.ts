#!/usr/bin/env node

import fs from "fs-extra";
import { isAbsolute, relative, resolve } from "node:path";
import { Command } from "commander";
import { parseErrorMessage } from "@/utils";
import { input } from "@inquirer/prompts";
import { Project } from "@/project";

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
█████╗   ██║ ██████╝  █████╗   ██║  ██║ █████╗   ██║      █████╔╝ 
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
      const project = new Project({ rootDir });

      await project.init({ projectName, projectDescription, projectVersion, projectAuthor });

      console.log("\nNext steps");
      console.log(`1. cd ${relative(process.cwd(), rootDir)}`);
      console.log(`2. npm install`);
      console.log(`3. npm run dev`);
    } catch (err) {
      console.error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("compile")
  .description("Analyzes the project and compiles the Firedeck runtime")
  .action(async () => {
    const project = new Project({ rootDir: process.cwd() });
    const runtime = await project.analyze();
    const changes = runtime.diffFrom(null);
    await project.updateRuntime(changes);

    console.log(`Project compiled ✅`);
    console.log(`Runtime:     .firedeck/runtime`);
    console.log(`Client SDK:  modules/sdk/client`);
  });

cli
  .command("run")
  .description("Starts the development runtime")
  .action(async () => {
    const project = new Project({ rootDir: process.cwd() });
    await project.run({ log: console.log, error: console.error });
  });

const moduleCli = new Command("module");
moduleCli.description("Manages firedeck modules in the project");

moduleCli
  .command("new <name>")
  .option("--client-only", "client-only module")
  .option("--server-only", "server-only module")
  .description("Create a new Firedeck module named <name> with client and server components")
  .action(async (moduleName, opts) => {
    try {
      const project = new Project({ rootDir: process.cwd() });

      if (opts.clientOnly && opts.serverOnly)
        throw "--client-only and --server-only cannot be specified at the same time";

      const components = opts.clientOnly ? "client" : opts.serverOnly ? "server" : "all";
      await project.createModule({ moduleName, components });

      console.log(`Created new module: modules/${moduleName}`);
    } catch (err) {
      console.error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli.addCommand(moduleCli);

cli.parse(process.argv);
