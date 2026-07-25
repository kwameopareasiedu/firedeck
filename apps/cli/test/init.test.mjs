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
  t.true(fs.existsSync(resolve(testDir, "firedeck/env-client.d.ts")));
  t.true(fs.existsSync(resolve(testDir, "firedeck/env-backend.d.ts")));
  t.true(fs.existsSync(resolve(testDir, "temp/firebase/emulator/.gitignore")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/index.html")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/index.css")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/root.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/pages/index-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/pages/404/not-found-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/main/public/favicon.svg")));
  t.true(fs.existsSync(resolve(testDir, "modules/backend/api/functions/hello.ts")));
  t.true(fs.existsSync(resolve(testDir, "modules/shared/components/index.tsx")));

  const packageJson = await fs.readJSONSync(resolve(testDir, "package.json"));
  t.is(packageJson.name, "ava-test");
  t.is(packageJson.description, "Test Ava project");
  t.is(packageJson.version, "0.1.0");
  t.is(packageJson.author, "Kwame");

  let packageManagerVersion = execSync("yarn --version", { encoding: "utf-8" }).trim();
  if (!packageManagerVersion) throw `package manager not found: npm`;

  let firedeckConfigSource = fs.readFileSync(resolve(testDir, "firedeck.config.ts"), {
    encoding: "utf-8",
  });
  t.true(firedeckConfigSource.includes(`name: "yarn"`));
  t.true(firedeckConfigSource.includes(`version: "${packageManagerVersion}"`));

  await init(testDir, {
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
    packageManagerName: "npm",
    update: true,
  });

  packageManagerVersion = execSync("npm --version", { encoding: "utf-8" }).trim();
  if (!packageManagerVersion) throw `package manager not found: npm`;

  firedeckConfigSource = fs.readFileSync(resolve(testDir, "firedeck.config.ts"), {
    encoding: "utf-8",
  });
  t.true(firedeckConfigSource.includes(`name: "npm"`));
  t.true(firedeckConfigSource.includes(`version: "${packageManagerVersion}"`));
});
