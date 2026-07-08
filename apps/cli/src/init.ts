import fs from "fs-extra";
import { input } from "@inquirer/prompts";
import { generateProjectContents } from "@/templates";
import { relative } from "node:path";
import { writeFileContents } from "@/utils";

export async function init(args: { rootDir: string }) {
  if (!fs.existsSync(args.rootDir)) {
    fs.ensureDirSync(args.rootDir);
  } else if (fs.readdirSync(args.rootDir).length !== 0) {
    throw `./${relative(process.cwd(), args.rootDir)}: directory is not empty`;
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

  await writeFileContents(args.rootDir, projectContents);

  console.log("\nNext steps");
  console.log(`1. cd ${relative(process.cwd(), args.rootDir)}`);
  console.log(`2. npm install`);
  console.log(`3. npm run dev`);
}
