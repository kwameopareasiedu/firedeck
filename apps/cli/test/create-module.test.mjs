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

  await createModule(testDir, { name: "admin", type: "client" });

  t.true(fs.existsSync(resolve(testDir, "modules/client/admin/index.html")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/admin/index.css")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/admin/root.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/admin/pages/index-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/client/admin/pages/404/not-found-page.tsx")));

  await createModule(testDir, { name: "api2", type: "backend" });
  t.true(fs.existsSync(resolve(testDir, "modules/backend/api2/functions/hello.ts")));
});
