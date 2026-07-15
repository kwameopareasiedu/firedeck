import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";
import { analyzeProject } from "../temp/analyze-project.js";
import { writeFileTree } from "../temp/utils.js";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/testing");

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("analyze-project", async (t) => {
  await init(testDir, {
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
    packageManagerName: "yarn",
  });

  execSync("yarn --prefer-offline", { cwd: testDir });

  const mainModuleFileTree = {
    "modules/main/client/pages/index-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(public)/landing/landing-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      };`,
    },
    "modules/main/client/pages/(public)/contact/contact-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      };`,
    },
    "modules/main/client/pages/(public)/features/features-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/dashboard-layout.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/users/users-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
  };

  await writeFileTree(testDir, mainModuleFileTree);

  const projectModel = await analyzeProject(testDir);

  t.is(projectModel.clients.length, 1);

  t.deepEqual(projectModel.clients[0].routes, {
    pageName: null,
    pageImportPath: null,
    layoutName: null,
    layoutImportPath: null,
    placeholderName: null,
    placeholderImportPath: null,
    guardName: null,
    guardImportPath: null,
    urlPath: null,
    children: [
      {
        pageName: "IndexPage",
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutName: null,
        layoutImportPath: null,
        placeholderName: null,
        placeholderImportPath: null,
        guardName: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
      {
        pageName: null,
        pageImportPath: null,
        layoutName: "DashboardLayout",
        layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
        placeholderName: null,
        placeholderImportPath: null,
        guardName: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: "UsersPage",
            pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            guardName: null,
            guardImportPath: null,
            urlPath: "/users",
            children: [
              {
                pageName: "UserDetailsPage",
                pageImportPath:
                  "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
                layoutName: null,
                layoutImportPath: null,
                placeholderName: null,
                placeholderImportPath: null,
                guardName: null,
                guardImportPath: null,
                urlPath: "/users/:userId",
                children: [],
              },
            ],
          },
        ],
      },
      {
        pageName: null,
        pageImportPath: null,
        layoutName: null,
        layoutImportPath: null,
        placeholderName: null,
        placeholderImportPath: null,
        guardName: null,
        guardImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: "ContactPage",
            pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            guardName: null,
            guardImportPath: null,
            urlPath: "/contact",
            children: [],
          },
          {
            pageName: "FeaturesPage",
            pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            guardName: null,
            guardImportPath: null,
            urlPath: "/features",
            children: [],
          },
          {
            pageName: "LandingPage",
            pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            guardName: null,
            guardImportPath: null,
            urlPath: "/landing",
            children: [],
          },
        ],
      },
      {
        pageName: "NotFoundPage",
        pageImportPath: "@/main/client/pages/404/not-found-page.tsx",
        layoutName: null,
        layoutImportPath: null,
        placeholderName: null,
        placeholderImportPath: null,
        guardName: null,
        guardImportPath: null,
        urlPath: "/*",
        children: [],
      },
    ],
  });
});
