#!/usr/bin/env node

import fs from "fs-extra";
import { isAbsolute, relative, resolve, basename } from "node:path";
import { Command } from "commander";
import { error, getFiredeckAsciiArt, getProjectPaths, info, parseErrorMessage } from "@/utils";
import { input, select } from "@inquirer/prompts";
import { PackageManagerName, packageManagers } from "shared/package-manager";
import { init } from "@/init";
import { createModule } from "@/create-module";
import { compileProject } from "@/compile-project";
import { runProject } from "@/run-project";
import { buildProject } from "@/build-project";
import { deployProject } from "@/deploy-project";
import chalk from "chalk";

const packageInfo = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), { encoding: "utf-8" }),
);

const cli = new Command("firedeck");
cli.description(packageInfo.description);
cli.version(packageInfo.version, "-v");
cli.addHelpText("beforeAll", getFiredeckAsciiArt());

cli
  .command("init <rootDir>")
  .description("Initialize a Firedeck project")
  .option("--update", "update config files only")
  .action(async (_rootDir, opts) => {
    try {
      console.log(getFiredeckAsciiArt());

      const update = Boolean(opts.update);
      const rootDir = isAbsolute(_rootDir) ? _rootDir : resolve(process.cwd(), _rootDir);

      const projectName = !update
        ? await input({
            message: "Name:",
            default: basename(rootDir),
            pattern: /^[a-z0-9-_]{1,214}$/,
          })
        : "";
      const projectDescription = !update ? await input({ message: "Description:" }) : "";
      const projectVersion = !update ? await input({ message: "Version:", default: "0.1.0" }) : "";
      const projectAuthor = !update ? await input({ message: "Author:" }) : "";
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
        update,
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
  .description("Add a new module to a Firedeck project")
  .option("--client", "create a client module")
  .option("--backend", "create a backend module")
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
  .description("Compile the Firedeck runtime")
  .option("--alias <alias>", "firebase project alias to compile for")
  .option("--explain", "log the mutations applied on the project")
  .action(async (opts) => {
    try {
      await compileProject(process.cwd(), null, {
        explain: opts.explain,
        firebaseProjectAlias: opts.alias,
      });

      const { runtimeDir, clientSdkDir } = getProjectPaths(process.cwd());

      info("Project compiled");
      info(`Runtime: ${relative(process.cwd(), runtimeDir)}`);
      info(`Client SDK: ${relative(process.cwd(), clientSdkDir)}`);
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("run")
  .description("Start the Firedeck runtime")
  .option("--alias <alias>", "firebase project alias to run on")
  .option("--explain", "log the mutations applied on the project")
  .action(async (opts) => {
    try {
      await runProject(process.cwd(), { explain: opts.explain, firebaseProjectAlias: opts.alias });
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("build")
  .description("Build all modules for deployment")
  .option("--alias <alias>", "firebase project alias to build for")
  .option("--explain", "log the mutations applied on the project")
  .action(async (opts) => {
    try {
      await buildProject(process.cwd(), {
        explain: opts.explain,
        firebaseProjectAlias: opts.alias,
      });
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli
  .command("deploy")
  .description("Deploy modules to Firebase")
  .requiredOption("--alias <alias>", "firebase project alias to deploy to")
  .option("--functions-batch-size <fnBatchSize>", "number of cloud functions to deploy in a batch")
  .option("--no-build", `skip project build ${chalk.yellow("(⚠: may deploy stale project)")}`)
  .option("--dry-run", "validate and build project without actually deploying to firebase")
  .action(async (opts) => {
    try {
      const functionsBatchSize =
        opts.functionsBatchSize !== undefined ? Number.parseInt(opts.functionsBatchSize) : null;

      if (Number.isNaN(functionsBatchSize)) throw "invalid functions-batch-size";
      else if (functionsBatchSize !== null && functionsBatchSize <= 1)
        throw "functions-batch-size must be more than 1";

      await deployProject(process.cwd(), {
        firebaseProjectAlias: opts.alias,
        functionsBatchSize: functionsBatchSize,
        build: opts.build,
        dryRun: opts.dryRun,
      });
    } catch (err) {
      error(parseErrorMessage(err));
      process.exit(-1);
    }
  });

cli.parse(process.argv);
