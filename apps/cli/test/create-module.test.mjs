import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";
import { createModule } from "../temp/create-module.js";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/test-create-module");

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("create-module", async (t) => {
  await init(testDir, {
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
    packageManagerName: "yarn",
  });

  execSync("yarn --prefer-offline", { cwd: testDir });

  await createModule(testDir, {
    moduleName: "admin",
    components: "all",
  });

  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/.env")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.html")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.css")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/pages/index-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/pages/404/not-found-page.tsx")));
});
