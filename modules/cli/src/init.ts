import fs from "fs-extra";
import { input } from "@inquirer/prompts";
import { generateProjectContents } from "@/templates";
import { resolve, extname, relative } from "node:path";
import { format } from "prettier";
import { getPrettierConfig } from "@/utils";

export async function init(args: { rootDir: string }) {
  if (!fs.existsSync(args.rootDir)) {
    fs.ensureDirSync(args.rootDir);
  } else if (fs.readdirSync(args.rootDir).length !== 0) {
    throw new Error(`${args.rootDir}: directory is not empty`);
  }

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

  const projectContents = generateProjectContents({
    name: projectName,
    description: projectDescription,
    version: projectVersion,
    author: projectAuthor,
  });

  for (const relativePath in projectContents) {
    const filePath = resolve(args.rootDir, relativePath);
    const fileProperties = projectContents[relativePath];
    const fileExt = fileProperties.extension || extname(filePath);
    const fileContent = await format(
      fileProperties.content,
      getPrettierConfig({ filePath: "a." + fileExt }),
    );

    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, Buffer.from(fileContent, "utf-8"));
  }

  fs.ensureDirSync(resolve(args.rootDir, ".firedeck"));
  fs.ensureDirSync(resolve(args.rootDir, "modules"));

  console.log("\nNext steps");
  console.log(`1. cd ${relative(process.cwd(), args.rootDir)}`);
  console.log(`2. npm install`);
  console.log(`3. npm run dev`);
}
