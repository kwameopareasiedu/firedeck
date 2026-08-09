import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";
import { analyzeProject } from "../temp/analyze-project.js";
import { writeFileTree, getPrettierConfig } from "../temp/utils.js";
import { format } from "prettier";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/test-analyze-project");

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
    ".env": {
      content: `
MAIN__VITE_HELLO=world
MAIN__VITE_FOO=bar
ADMIN__VITE_HELLO=world
      `,
    },
    "modules/client/main/pages/index-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/client/main/pages/(public)/landing/landing.page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      };`,
    },
    "modules/client/main/pages/(public)/contact/contact.page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      };`,
    },
    "modules/client/main/pages/(public)/features/features-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/client/main/pages/(dashboard)/dashboard.layout.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/client/main/pages/(dashboard)/users/users-layout.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/client/main/pages/(dashboard)/users/users-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: `
      export default function() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/backend/api/functions/hello.ts": {
      content: `
      import {onCall} from "firebase-functions/v2/https";
      
      export default onCall(async function(req) {
        return "Hello";
      });`,
    },
    "modules/backend/api/functions/get-user-data.ts": {
      content: `
      import {onCall} from "firebase-functions/v2/https";
      
      export default onCall(async function(req) {
        return { name: "Kwame", occupation: "10x Dev" };
      });`,
    },
  };

  await writeFileTree(testDir, mainModuleFileTree);

  const projectModel = await analyzeProject(testDir, "dev");

  const packageManagerVersion = execSync("yarn --version", { encoding: "utf-8" }).trim();
  if (!packageManagerVersion) throw `package manager not found: yarn`;

  t.is(projectModel.clients.length, 1);
  t.is(projectModel.backends.length, 1);

  t.is(projectModel.clients[0].name, "main");
  t.deepEqual(projectModel.clients[0].routes, {
    pageName: "IndexPage",
    pageImportPath: "@/client/main/pages/index-page.tsx",
    layoutName: null,
    layoutImportPath: null,
    placeholderName: null,
    placeholderImportPath: null,
    beforeName: null,
    beforeImportPath: null,
    urlPath: "/",
    children: [
      {
        pageName: null,
        pageImportPath: null,
        layoutName: "DashboardLayout",
        layoutImportPath: "@/client/main/pages/(dashboard)/dashboard.layout.tsx",
        placeholderName: null,
        placeholderImportPath: null,
        beforeName: null,
        beforeImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: "UsersPage",
            pageImportPath: "@/client/main/pages/(dashboard)/users/users-page.tsx",
            layoutName: "UsersLayout",
            layoutImportPath: "@/client/main/pages/(dashboard)/users/users-layout.tsx",
            placeholderName: null,
            placeholderImportPath: null,
            beforeName: null,
            beforeImportPath: null,
            urlPath: "/users",
            children: [
              {
                pageName: "UserDetailsPage",
                pageImportPath:
                  "@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx",
                layoutName: null,
                layoutImportPath: null,
                placeholderName: null,
                placeholderImportPath: null,
                beforeName: null,
                beforeImportPath: null,
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
        beforeName: null,
        beforeImportPath: null,
        urlPath: null,
        children: [
          {
            pageName: "ContactPage",
            pageImportPath: "@/client/main/pages/(public)/contact/contact.page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            beforeName: null,
            beforeImportPath: null,
            urlPath: "/contact",
            children: [],
          },
          {
            pageName: "FeaturesPage",
            pageImportPath: "@/client/main/pages/(public)/features/features-page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            beforeName: null,
            beforeImportPath: null,
            urlPath: "/features",
            children: [],
          },
          {
            pageName: "LandingPage",
            pageImportPath: "@/client/main/pages/(public)/landing/landing.page.tsx",
            layoutName: null,
            layoutImportPath: null,
            placeholderName: null,
            placeholderImportPath: null,
            beforeName: null,
            beforeImportPath: null,
            urlPath: "/landing",
            children: [],
          },
        ],
      },
      {
        pageName: "NotFoundPage",
        pageImportPath: "@/client/main/pages/404/not-found-page.tsx",
        layoutName: null,
        layoutImportPath: null,
        placeholderName: null,
        placeholderImportPath: null,
        beforeName: null,
        beforeImportPath: null,
        urlPath: "/*",
        children: [],
      },
    ],
  });

  t.is(
    projectModel.clients[0].indexHtml,
    await format(
      `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Main</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/index.tsx"></script>
        </body>
      </html>`,
      getPrettierConfig({ filePath: "a.html" }),
    ),
  );

  t.is(
    projectModel.clients[0].env,
    `VITE_HELLO=world
VITE_FOO=bar`,
  );

  t.true(projectModel.clients[0].publicLastModifiedTs > 0);

  t.deepEqual(projectModel.backends[0], {
    name: "api",
    functions: [
      {
        name: "apiGetUserData",
        importPath: "@/backend/api/functions/get-user-data.ts",
      },
      {
        name: "apiHello",
        importPath: "@/backend/api/functions/hello.ts",
      },
    ],
    env: "",
  });
});
