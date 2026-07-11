import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import {
  analyzeProject,
  applyWorkspaceChanges,
  compareWorkspaces,
  init,
} from "../temp/functions.js";
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

test("analyze-project", async (t) => {
  await init({
    rootDir: testRoot,
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  const mainModuleClientHierarchy = {
    "modules/main/client/pages/index-page.tsx": { content: "" },
    "modules/main/client/pages/(public)/landing/landing-page.tsx": { content: "" },
    "modules/main/client/pages/(public)/contact/contact-page.tsx": { content: "" },
    "modules/main/client/pages/(public)/features/features-page.tsx": { content: "" },
    "modules/main/client/pages/(dashboard)/dashboard-layout.tsx": { content: "" },
    "modules/main/client/pages/(dashboard)/users/users-page.tsx": { content: "" },
    "modules/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx": { content: "" },
  };

  await writeOutputHierarchy(testRoot, mainModuleClientHierarchy);

  const workspace = await analyzeProject({ rootDir: testRoot });

  t.is(workspace.clients.length, 1);
  t.deepEqual(workspace.clients[0].routes, {
    pageImportPath: "@/main/client/pages/index-page.tsx.tsx",
    layoutImportPath: null,
    placeholderImportPath: null,
    guardImportPath: null,
    urlPath: "/",
    children: [
      {
        pageImportPath: null,
        layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx.tsx",
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/users",
            children: [
              {
                pageImportPath:
                  "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/users/:userId",
                children: [],
              },
            ],
          },
        ],
      },
      {
        pageImportPath: null,
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/contact",
            children: [],
          },
          {
            pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/features",
            children: [],
          },
          {
            pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/landing",
            children: [],
          },
        ],
      },
    ],
  });
});

test("compare-workspaces", async (t) => {
  const w1 = {
    clients: [
      {
        name: "main",
        routes: {
          pageImportPath: "@/main/client/pages/index-page.tsx.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx.tsx",
              urlPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      guardImportPath: null,
                      urlPath: "/users/:userId",
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const w2 = {
    clients: [
      {
        name: "main",
        routes: {
          pageImportPath: "@/main/client/pages/index-page.tsx.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      guardImportPath: null,
                      urlPath: "/users/:userId",
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
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
        routes: {
          pageImportPath: "@/main/client/pages/index-page.tsx.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      guardImportPath: null,
                      urlPath: "/users/:userId",
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {
        name: "admin",
        routes: {
          pageImportPath: "@/main/client/pages/index-page.tsx.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [],
        },
      },
    ],
  };

  const w1w2Changes = compareWorkspaces(w1, w2);
  const w1w3Changes = compareWorkspaces(w1, w3);
  const w1w4Changes = compareWorkspaces(w1, w4);
  const nullW4Changes = compareWorkspaces(null, w4);

  t.deepEqual(w1w2Changes, [{ type: "update-client-routes", clientName: "main" }]);
  t.deepEqual(w1w3Changes, [{ type: "remove-client", clientName: "main" }]);
  t.deepEqual(w1w4Changes, [
    { type: "rename-client", oldClientName: "main", newClientName: "external" },
    { type: "update-client-routes", clientName: "external" },
    { type: "add-client", clientName: "admin" },
  ]);
  t.deepEqual(nullW4Changes, [
    { type: "create-runtime" },
    { type: "add-client", clientName: "external" },
    { type: "add-client", clientName: "admin" },
  ]);
});

test("apply-workspace-changes", async (t) => {
  const skeletonProjectHierarchy = { "firedeck.json": { content: "{}" } };
  await writeOutputHierarchy(testRoot, skeletonProjectHierarchy);

  // const currentWorkspace = {
  //   clients: [],
  // };

  const targetWorkspace = {
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

  const changes = compareWorkspaces(null, targetWorkspace);
  await applyWorkspaceChanges({ rootDir: testRoot, changes });

  t.pass();
});
