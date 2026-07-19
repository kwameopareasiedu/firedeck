#!/usr/bin/env node

import fs from "fs-extra";
import { isAbsolute, relative, resolve } from "node:path";
import { Command } from "commander";
import { error, info, parseErrorMessage } from "@/utils";
import { input, select } from "@inquirer/prompts";
import { PackageManagerName, packageManagers } from "shared/package-manager";
import { init } from "@/init";
import { createModule } from "@/create-module";
import { compileProject } from "@/compile-project";
import { runProject } from "@/run-project";
import { buildProject } from "@/build-project";
import { deployProject } from "@/deploy-project";

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

      await init(rootDir, {
        projectName,
        projectDescription,
        projectVersion,
        projectAuthor,
        packageManagerName,
      });

      const nextSteps = [];
      const relativeRootDir = relative(process.cwd(), rootDir);
      const packageManager = packageManagers[packageManagerName];

      if (relativeRootDir) nextSteps.push(`cd ${relativeRootDir}`);
      nextSteps.push(...packageManager.postInitSteps);

      info("Next steps");

      for (let i = 0; i < nextSteps.length; i++) {
        const step = nextSteps[i];
        info(`${i + 1}. ${step}`);
      }
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("module <moduleName>")
  .option("--client", "create a client module")
  .option("--backend", "create a backend module")
  .description("Adds a new module to a Firedeck project")
  .action(async (moduleName, opts) => {
    try {
      if (!opts.client && !opts.backend) throw "either --client or --backend option required";
      if (opts.client && opts.backend)
        throw "--client and --backend cannot be specified at the same time";

      const moduleType = opts.client ? "client" : opts.backend ? "backend" : undefined;
      if (!moduleType) throw `invalid module type: ${moduleType}`;

      await createModule(process.cwd(), { name: moduleName, type: moduleType });

      info(`Created new ${moduleType} module: modules/${moduleType}/${moduleName}`);
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("compile")
  .description("Compiles the Firedeck runtime")
  .action(async () => {
    try {
      await compileProject(process.cwd());

      info("Project compiled");
      info("Runtime: .firedeck/runtime");
      info("Client SDK: modules/sdk/client");
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("run")
  .description("Starts the Firedeck runtime")
  .action(async () => {
    try {
      await runProject(process.cwd(), { log: info, error: console.error });
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("build")
  .description("Builds all modules for deployment")
  .action(async () => {
    try {
      await buildProject(process.cwd());
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("deploy")
  .description("Deploys built modules to their respective Firebase components")
  .option("--alias <alias>", "firebase project alias to deploy to")
  .option("--no-build", "skip project build")
  .action(async (opts) => {
    try {
      await deployProject(process.cwd(), { alias: opts.alias, build: opts.build });
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli.parse(process.argv);
