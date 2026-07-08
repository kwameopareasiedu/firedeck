import fs from "fs-extra";
import { resolve } from "node:path";
import { Command } from "commander";
import { init } from "@/init";

const packageInfo = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), { encoding: "utf-8" }),
);

const cli = new Command("Firedeck");
cli.description(packageInfo.description);
cli.version(packageInfo.version, "-v");

cli
  .command("init <rootDir>")
  .description("Create a new Firedeck project at the specified directory <rootDir>")
  .action(async (rootDir) => {
    const absRootDirectory = resolve(process.cwd(), rootDir);
    await init({ rootDir: absRootDirectory });
  });

cli.parse(process.argv);
