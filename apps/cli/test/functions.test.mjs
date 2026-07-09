import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { init } from "../temp/functions.js";

const __dirname = import.meta.dirname;
const testRoot = resolve(__dirname, "../temp/test-target");

test.beforeEach(() => {
  fs.removeSync(testRoot);
  fs.ensureDirSync(testRoot);
});

test.afterEach(() => {
  fs.removeSync(testRoot);
});

test("init", async (t) => {
  await init({
    rootDir: testRoot,
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  t.true(fs.existsSync(resolve(testRoot, "package.json")));
  t.true(fs.existsSync(resolve(testRoot, "firedeck.json")));
  t.true(fs.existsSync(resolve(testRoot, "tsconfig.json")));
  t.true(fs.existsSync(resolve(testRoot, ".prettierrc")));
  t.true(fs.existsSync(resolve(testRoot, ".gitignore")));
  t.true(fs.existsSync(resolve(testRoot, "modules", "main")));
  t.true(fs.existsSync(resolve(testRoot, "modules", "shared")));

  const packageJson = await fs.readJSONSync(resolve(testRoot, "package.json"));
  t.is(packageJson.name, "ava-test");
  t.is(packageJson.description, "Test Ava project");
  t.is(packageJson.version, "0.1.0");
  t.is(packageJson.author, "Kwame");
});
