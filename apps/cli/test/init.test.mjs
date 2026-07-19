import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/test-init");

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("init", async (t) => {
  await init(testDir, {
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
    packageManagerName: "yarn",
  });

  execSync("yarn --prefer-offline", { cwd: testDir });

  t.true(fs.existsSync(resolve(testDir, ".env")));
  t.true(fs.existsSync(resolve(testDir, "package.json")));
  t.true(fs.existsSync(resolve(testDir, "firedeck.config.ts")));
  t.true(fs.existsSync(resolve(testDir, "tsconfig.json")));
  t.true(fs.existsSync(resolve(testDir, ".prettierrc")));
  t.true(fs.existsSync(resolve(testDir, ".gitignore")));
  t.true(fs.existsSync(resolve(testDir, ".firedeck/env.d.ts")));
  t.true(fs.existsSync(resolve(testDir, ".temp/firebase-emulator/.gitignore")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/index.html")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/index.css")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/root.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/pages/404/not-found-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/backend/api/functions/hello.ts")));
  t.true(fs.existsSync(resolve(testDir, "modules/shared/components/index.tsx")));

  const packageJson = await fs.readJSONSync(resolve(testDir, "package.json"));
  t.is(packageJson.name, "ava-test");
  t.is(packageJson.description, "Test Ava project");
  t.is(packageJson.version, "0.1.0");
  t.is(packageJson.author, "Kwame");
});
