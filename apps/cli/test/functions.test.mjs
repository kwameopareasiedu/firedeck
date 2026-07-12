import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import {
  analyzeProject,
  applyWorkspaceChanges,
  compareWorkspaces,
  createRouterSource,
  init,
} from "../temp/functions.js";
import { getPrettierConfig, writeFileTree } from "../temp/utils.js";
import prettier from "prettier";

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

  const mainModuleFileTree = {
    "modules/main/client/pages/index-page.tsx": {
      content: "export default function IndexPage() {}",
    },
    "modules/main/client/pages/(public)/landing/landing-page.tsx": {
      content: "const LandingPage = () => {};export default LandingPage",
    },
    "modules/main/client/pages/(public)/contact/contact-page.tsx": {
      content: "function ContactPage() {}; export default ContactPage",
    },
    "modules/main/client/pages/(public)/features/features-page.tsx": {
      content: "export default function FeaturesPage() {}",
    },
    "modules/main/client/pages/(dashboard)/dashboard-layout.tsx": {
      content: "export default function DashboardLayout() {}",
    },
    "modules/main/client/pages/(dashboard)/users/users-page.tsx": {
      content: "export default function UsersPage() {}",
    },
    "modules/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: "export default function UserDetailsPage() {}",
    },
  };

  await writeFileTree(testRoot, mainModuleFileTree);

  const workspace = await analyzeProject({ rootDir: testRoot });

  t.is(workspace.clients.length, 1);

  t.deepEqual(workspace.clients[0].routes, {
    name: "IndexPage",
    pageImportPath: "@/main/client/pages/index-page.tsx",
    layoutImportPath: null,
    placeholderImportPath: null,
    guardImportPath: null,
    urlPath: "/",
    children: [
      {
        name: "DashboardGroup",
        pageImportPath: null,
        layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            name: "UsersPage",
            pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/users",
            children: [
              {
                name: "UserDetailsPage",
                pageImportPath:
                  "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
        name: "PublicGroup",
        pageImportPath: null,
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            name: "ContactPage",
            pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/contact",
            children: [],
          },
          {
            name: "FeaturesPage",
            pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/features",
            children: [],
          },
          {
            name: "LandingPage",
            pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
          name: "IndexPage",
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
              urlPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
              name: null,
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "ContactPage",
                  pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
        html: { hash: 0x123456 },
      },
    ],
  };

  const w2 = {
    clients: [
      {
        name: "main",
        routes: {
          name: "IndexPage",
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
              name: null,
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
        html: { hash: 0x123456 },
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
          name: "IndexPage",
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
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
              name: null,
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "ContactPage",
                  pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
        html: { hash: 0x654321 },
      },
      {
        name: "admin",
        routes: {
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [],
        },
        html: { hash: 0xa88980 },
      },
    ],
  };

  const w1w2Changes = compareWorkspaces(w1, w2);
  const w1w3Changes = compareWorkspaces(w1, w3);
  const w1w4Changes = compareWorkspaces(w1, w4);
  const nullW4Changes = compareWorkspaces(null, w4);

  t.deepEqual(w1w2Changes, [
    {
      type: "update-client-routes",
      clientName: "main",
      clientRoutes: {
        name: "IndexPage",
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [
          {
            name: "DashboardGroup",
            pageImportPath: null,
            layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "UsersPage",
                pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/users",
                children: [
                  {
                    name: "UserDetailsPage",
                    pageImportPath:
                      "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
            name: null,
            pageImportPath: null,
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "FeaturesPage",
                pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/features",
                children: [],
              },
              {
                name: "LandingPage",
                pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
  ]);

  t.deepEqual(w1w3Changes, [{ type: "remove-client", clientName: "main" }]);

  t.deepEqual(w1w4Changes, [
    { type: "rename-client", oldClientName: "main", newClientName: "external" },
    {
      type: "update-client-routes",
      clientName: "external",
      clientRoutes: {
        name: "IndexPage",
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [
          {
            name: "DashboardGroup",
            pageImportPath: null,
            layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "UsersPage",
                pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/users",
                children: [
                  {
                    name: "UserDetailsPage",
                    pageImportPath:
                      "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
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
            name: null,
            pageImportPath: null,
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "ContactPage",
                pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/contact",
                children: [],
              },
              {
                name: "FeaturesPage",
                pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/features",
                children: [],
              },
              {
                name: "LandingPage",
                pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
    { type: "update-client-html", clientName: "external" },
    { type: "add-client", clientName: "admin" },
    {
      type: "update-client-routes",
      clientName: "admin",
      clientRoutes: {
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
    },
  ]);

  t.deepEqual(nullW4Changes, [
    { type: "create-runtime" },
    { type: "add-client", clientName: "external" },
    {
      type: "update-client-routes",
      clientName: "external",
      clientRoutes: {
        name: "IndexPage",
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [
          {
            name: "DashboardGroup",
            pageImportPath: null,
            layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "UsersPage",
                pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/users",
                children: [
                  {
                    name: "UserDetailsPage",
                    pageImportPath:
                      "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
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
            name: null,
            pageImportPath: null,
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: null,
            children: [
              {
                name: "ContactPage",
                pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/contact",
                children: [],
              },
              {
                name: "FeaturesPage",
                pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                layoutImportPath: null,
                placeholderImportPath: null,
                guardImportPath: null,
                urlPath: "/features",
                children: [],
              },
              {
                name: "LandingPage",
                pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
    { type: "add-client", clientName: "admin" },
    {
      type: "update-client-routes",
      clientName: "admin",
      clientRoutes: {
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
    },
  ]);
});

test("create-router-source", async (t) => {
  const routerSource = await createRouterSource({
    name: "IndexPage",
    pageImportPath: "@/main/client/pages/index-page.tsx",
    layoutImportPath: null,
    placeholderImportPath: null,
    guardImportPath: null,
    urlPath: "/",
    children: [
      {
        name: "DashboardGroup",
        pageImportPath: null,
        layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            name: "UsersPage",
            pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/users",
            children: [
              {
                name: "UserDetailsPage",
                pageImportPath:
                  "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
        name: "PublicGroup",
        pageImportPath: null,
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            name: "ContactPage",
            pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/contact",
            children: [],
          },
          {
            name: "FeaturesPage",
            pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
            layoutImportPath: null,
            placeholderImportPath: null,
            guardImportPath: null,
            urlPath: "/features",
            children: [],
          },
          {
            name: "LandingPage",
            pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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

  const formattedExpectedSource = await prettier.format(
    fs.readFileSync(resolve(__dirname, "router-source-expected.txt"), { encoding: "utf-8" }),
    getPrettierConfig({ filePath: "a.tsx" }),
  );

  t.is(routerSource, formattedExpectedSource);
});

test("apply-workspace-changes", async (t) => {
  const skeletonProjectFileTree = { "firedeck.json": { content: "{}" } };
  await writeFileTree(testRoot, skeletonProjectFileTree);

  const targetWorkspace = {
    clients: [
      {
        name: "external",
        routes: {
          name: "IndexPage",
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
              name: "PublicGroup",
              pageImportPath: null,
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "ContactPage",
                  pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
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
          name: "IndexPage",
          pageImportPath: "@/main/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [],
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const changes = compareWorkspaces(null, targetWorkspace);
  await applyWorkspaceChanges({ rootDir: testRoot, changes });

  t.pass();
});
