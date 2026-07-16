import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";
import { analyzeProject } from "../temp/analyze-project.js";
import { compareProjectModels } from "../temp/compare-project-models.js";
import { applyProjectMutations } from "../temp/apply-project-mutations.js";
import { writeFileTree, getPrettierConfig } from "../temp/utils.js";
import { format } from "prettier";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/test-apply-project-mutations");

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("apply-project-mutations", async (t) => {
  await init(testDir, {
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
    packageManagerName: "yarn",
  });

  execSync("yarn --prefer-offline", { cwd: testDir });

  const fileTree = {
    "modules/client/main/pages/index-page.tsx": {
      content: `
        export default function IndexPage() {
          return <p>Hello World</p>;
        }`,
    },
    "modules/client/main/pages/(public)/landing/landing-page.tsx": {
      content: `
        const LandingPage = () => {
          return <p>Hello World</p>;
        };
        
        export default LandingPage
        `,
    },
    "modules/client/main/pages/(public)/contact/contact-page.tsx": {
      content: `
        function ContactPage() {
          return <p>Hello World</p>;
        };
        
        export default ContactPage
      `,
    },
    "modules/client/main/pages/(public)/features/features-page.tsx": {
      content: `
        export default function FeaturesPage() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/client/main/pages/(dashboard)/dashboard-layout.tsx": {
      content: `
        export default function DashboardLayout() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/client/main/pages/(dashboard)/users/users-page.tsx": {
      content: `
        export default function UsersPage() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: `
        export default function UserDetailsPage() {
          return <p>Hello World</p>;
        }
      `,
    },
  };

  await writeFileTree(testDir, fileTree);

  const pagesDir = resolve(testDir, "modules/client/main/pages");
  t.true(fs.existsSync(resolve(pagesDir, "index-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/landing/landing-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/contact/contact-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/features/features-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/dashboard-layout.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/users-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/[userId]/user-details-page.tsx")));

  const model = await analyzeProject(testDir);
  const mutations = compareProjectModels(null, model);
  await applyProjectMutations(testDir, mutations);

  const runtimeMainDir = resolve(testDir, ".firedeck/runtime/modules/main");
  t.true(fs.existsSync(resolve(runtimeMainDir, "package.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.app.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.node.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "vite.config.ts")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "index.html")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "global.d.ts")));
  t.true(fs.existsSync(resolve(runtimeMainDir, ".gitignore")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/index.tsx")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/index.css")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/routes.ts")));

  const routesSource = fs.readFileSync(resolve(runtimeMainDir, "src/routes.ts"), {
    encoding: "utf-8",
  });

  t.is(
    routesSource,
    await format(
      `export default [
        {
          children: [
            {
              id: "IndexPage",
              path: "/",
              lazy: { Component: () => import("@/client/main/pages/index-page.tsx").then((mod) => mod.default) },
            },
            {
              id: "DashboardLayout",
              lazy: { Component: () => import("@/client/main/pages/(dashboard)/dashboard-layout.tsx").then((mod) => mod.default) },
              children: [
                {
                  id: "UsersPage",
                  path: "/users",
                  lazy: { Component: () => import("@/client/main/pages/(dashboard)/users/users-page.tsx").then((mod) => mod.default) },
                  children: [
                    {
                      id: "UserDetailsPage",
                      path: "/users/:userId",
                      lazy: { Component: () => import("@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx").then((mod) => mod.default) },
                    },
                  ],
                },
              ],
            },
            {
              children: [
                {
                  id: "ContactPage",
                  path: "/contact",
                  lazy: { Component: () => import("@/client/main/pages/(public)/contact/contact-page.tsx").then((mod) => mod.default) },
                },
                {
                  id: "FeaturesPage",
                  path: "/features",
                  lazy: { Component: () => import("@/client/main/pages/(public)/features/features-page.tsx").then((mod) => mod.default) },
                },
                {
                  id: "LandingPage",
                  path: "/landing",
                  lazy: { Component: () => import("@/client/main/pages/(public)/landing/landing-page.tsx").then((mod) => mod.default) },
                },
              ],
            },
            {
              id: "NotFoundPage",
              path: "/*",
              lazy: { Component: () => import("@/client/main/pages/404/not-found-page.tsx").then((mod) => mod.default) },
            },
          ],
        },
      ];`,
      getPrettierConfig({ filePath: "a.ts" }),
    ),
  );

  const clientSdkDir = resolve(testDir, "modules/sdk/client");
  t.true(fs.existsSync(resolve(clientSdkDir, "routes.ts")));

  const generatedRoutesSource = fs.readFileSync(resolve(clientSdkDir, "routes.ts"), {
    encoding: "utf-8",
  });

  t.is(
    generatedRoutesSource,
    await format(
      `
      /**
       * ------------------------------------
       * This file was generated by Firedeck.
       *
       * Do not edit this file directly.
       * Your changes will be overwritten.
       * ------------------------------------
       */
     
      export enum MainRoute {
        INDEX_PAGE = "/",
        USERS_PAGE = "/users",
        USER_DETAILS_PAGE = "/users/:userId",
        CONTACT_PAGE = "/contact",
        FEATURES_PAGE = "/features",
        LANDING_PAGE = "/landing",
      }`,
      getPrettierConfig({ filePath: "a.ts" }),
    ),
  );
});
