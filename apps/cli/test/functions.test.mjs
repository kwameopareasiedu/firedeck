import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { init, analyzeProject, compareWorkspaces } from "../temp/functions.js";
import { writeOutputHierarchy } from "../temp/utils.js";

const __dirname = import.meta.dirname;
const testRoot = resolve(__dirname, "../temp/testing");

test.beforeEach(() => {
  fs.removeSync(testRoot);
  fs.ensureDirSync(testRoot);
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

test("analyze project", async (t) => {
  await init({
    rootDir: testRoot,
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  const mainModuleClientHierarchy = {
    "modules/main/client/pages/about.route.tsx": { content: "" },
    "modules/main/client/pages/pricing.route.tsx": { content: "" },
    "modules/main/client/pages/dashboard/index.route.tsx": { content: "" },
    "modules/main/client/pages/dashboard/settings.route.tsx": { content: "" },
  };

  await writeOutputHierarchy(testRoot, mainModuleClientHierarchy);

  const workspace = await analyzeProject({ rootDir: testRoot });
  t.is(workspace.clients.length, 1);
  t.is(workspace.clients[0].routes.length, 5);
});

test("compare workspaces", async (t) => {
  const w1 = {
    clients: [
      {
        name: "main",
        routes: [
          { urlPath: "/about", importPath: "@/main/client/pages/about.route.tsx" },
          { urlPath: "/", importPath: "@/main/client/pages/index.route.tsx" },
          { urlPath: "/pricing", importPath: "@/main/client/pages/pricing.route.tsx" },
          { urlPath: "/dashboard", importPath: "@/main/client/pages/dashboard/index.route.tsx" },
          {
            urlPath: "/dashboard/settings",
            importPath: "@/main/client/pages/dashboard/settings.route.tsx",
          },
        ],
      },
    ],
  };

  const w2 = {
    clients: [
      {
        name: "main",
        routes: [
          { urlPath: "/about", importPath: "@/main/client/pages/about.route.tsx" },
          { urlPath: "/", importPath: "@/main/client/pages/index.route.tsx" },
          { urlPath: "/pricing", importPath: "@/main/client/pages/pricing.route.tsx" },
          { urlPath: "/dashboard", importPath: "@/main/client/pages/dashboard/index.route.tsx" },
          {
            urlPath: "/dashboard/setup",
            importPath: "@/main/client/pages/dashboard/setup.route.tsx",
          },
        ],
      },
    ],
  };

  const w3 = {
    clients: [],
  };

  const w4 = {
    clients: [
      {
        name: "external",
        routes: [
          { urlPath: "/about", importPath: "@/main/client/pages/about.route.tsx" },
          { urlPath: "/", importPath: "@/main/client/pages/index.route.tsx" },
          { urlPath: "/pricing", importPath: "@/main/client/pages/pricing.route.tsx" },
          { urlPath: "/dashboard", importPath: "@/main/client/pages/dashboard/index.route.tsx" },
          {
            urlPath: "/dashboard/setup",
            importPath: "@/main/client/pages/dashboard/setup.route.tsx",
          },
        ],
      },
      {
        name: "admin",
        routes: [
          { urlPath: "/", importPath: "@/main/client/pages/index.route.tsx" },
          { urlPath: "/users", importPath: "@/main/client/pages/users/index.route.tsx" },
        ],
      },
    ],
  };

  const w1w2Changes = compareWorkspaces(w1, w2);
  const w1w3Changes = compareWorkspaces(w1, w3);
  const w1w4Changes = compareWorkspaces(w1, w4);

  t.deepEqual(w1w2Changes, [{ type: "client-routes-modified", clientName: "main" }]);
  t.deepEqual(w1w3Changes, [{ type: "client-removed", clientName: "main" }]);
  t.deepEqual(w1w4Changes, [
    { type: "client-renamed", oldClientName: "main", newClientName: "external" },
    { type: "client-routes-modified", clientName: "external" },
    { type: "client-added", clientName: "admin" },
  ]);
});
