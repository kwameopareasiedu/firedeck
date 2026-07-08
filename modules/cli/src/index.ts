import fs from "fs-extra";
import { resolve } from "node:path";
import { Command } from "commander";

const packageInfo = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), { encoding: "utf-8" }),
);

const cli = new Command("Firedeck");
cli.description(packageInfo.description);
cli.version(packageInfo.version, "-v");

cli
  .command("init <directory>")
  .description("Create a new Firedeck project at the specified directory")
  .action((directory) => {
    const absDirectory = resolve(process.cwd(), directory);
    console.log({ dir: absDirectory });
  });

cli.parse(process.argv);
