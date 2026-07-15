#!/usr/bin/env node

import fs from "fs-extra";
import { isAbsolute, relative, resolve } from "node:path";
import { Command } from "commander";
import { error, info, parseErrorMessage } from "@/utils";
import { input, select } from "@inquirer/prompts";
import { Project } from "@/project";
import { PackageManagerName } from "shared/package-manager";

const packageInfo = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), { encoding: "utf-8" }),
);

const cli = new Command("firedeck");
cli.description(packageInfo.description);
cli.version(packageInfo.version, "-v");

cli
  .command("init <rootDir>")
  .description("Create a new Firedeck project")
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
      const packageManagerName = await select({
        message: "Package Manager",
        choices: Object.values(PackageManagerName).map((name) => ({ name, value: name })),
      });
      const project = new Project({ rootDir });

      await project.init({
        projectName,
        projectDescription,
        projectVersion,
        projectAuthor,
        packageManagerName,
      });

      info("\nNext steps");
      info(`1. cd ${relative(process.cwd(), rootDir)}`);
      info(`2. npm install`);
      info(`3. npm run dev`);
    } catch (err) {
      error(parseErrorMessage(err), err);
      process.exit(-1);
    }
  });

cli
  .command("module <moduleName>")
  .option("--client-only", "client-only module")
  .option("--server-only", "server-only module")
  .description("Adds a new module to a Firedeck project")
  .action(async (moduleName, opts) => {
    try {
      const project = new Project({ rootDir: process.cwd() });

      if (opts.clientOnly && opts.serverOnly)
        throw "--client-only and --server-only cannot be specified at the same time";

      const components = opts.clientOnly ? "client" : opts.serverOnly ? "server" : "all";
      await project.createModule({ moduleName, components });

      info(`Created new module: modules/${moduleName}`);
    } catch (err) {
      error(parseErrorMessage(err), err);
      process.exit(-1);
    }
  });

cli
  .command("compile")
  .description("Compiles the Firedeck runtime")
  .action(async () => {
    try {
      const project = new Project({ rootDir: process.cwd() });
      const runtime = await project.analyze();
      const changes = runtime.diffFrom(null);
      await project.updateRuntime(changes);

      info("Project compiled");
      info("Runtime: .firedeck/runtime");
      info("Client SDK: modules/sdk/client");
    } catch (err) {
      error(parseErrorMessage(err), err);
      process.exit(-1);
    }
  });

cli
  .command("run")
  .description("Starts the Firedeck runtime")
  .action(async () => {
    try {
      const project = new Project({ rootDir: process.cwd() });
      await project.run({ log: info, error: console.error });
    } catch (err) {
      error(parseErrorMessage(err), err);
      process.exit(-1);
    }
  });

cli
  .command("build")
  .description("Builds all modules for deployment")
  .action(async () => {
    try {
      const project = new Project({ rootDir: process.cwd() });
      await project.build({ log: info, error: console.error });
    } catch (err) {
      error(parseErrorMessage(err), err);
      process.exit(-1);
    }
  });

cli.parse(process.argv);
