import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { Project } from "../temp/project.js";
import { writeFileTree, getPrettierConfig } from "../temp/utils.js";
import { format } from "prettier";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/testing");

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("init", async (t) => {
  const project = new Project({ rootDir: testDir });

  await project.init({
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  t.true(fs.existsSync(resolve(testDir, "package.json")));
  t.true(fs.existsSync(resolve(testDir, "firedeck.json")));
  t.true(fs.existsSync(resolve(testDir, "tsconfig.json")));
  t.true(fs.existsSync(resolve(testDir, ".prettierrc")));
  t.true(fs.existsSync(resolve(testDir, ".gitignore")));
  t.true(fs.existsSync(resolve(testDir, "modules/main")));
  t.true(fs.existsSync(resolve(testDir, "modules/shared")));

  const packageJson = await fs.readJSONSync(resolve(testDir, "package.json"));
  t.is(packageJson.name, "ava-test");
  t.is(packageJson.description, "Test Ava project");
  t.is(packageJson.version, "0.1.0");
  t.is(packageJson.author, "Kwame");
});

test("create-module", async (t) => {
  const project = new Project({ rootDir: testDir });

  await project.init({
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  await project.createModule({
    moduleName: "admin",
    components: "all",
  });

  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.html")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.css")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/index.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/pages/index-page.tsx")));
  t.true(fs.existsSync(resolve(testDir, "modules/admin/client/pages/404/not-found-page.tsx")));
});

test("analyze", async (t) => {
  const project = new Project({ rootDir: testDir });

  await project.init({
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  const mainModuleFileTree = {
    "modules/main/client/pages/index-page.tsx": {
      content: `
      export default function IndexPage() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(public)/landing/landing-page.tsx": {
      content: `
      const LandingPage = () => {
        return <p>Hello World</p>;
      };

      export default LandingPage;`,
    },
    "modules/main/client/pages/(public)/contact/contact-page.tsx": {
      content: `
      function ContactPage() {
        return <p>Hello World</p>;
      };

      export default ContactPage;`,
    },
    "modules/main/client/pages/(public)/features/features-page.tsx": {
      content: `
      export default function FeaturesPage() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/dashboard-layout.tsx": {
      content: `
      export default function DashboardLayout() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/users/users-page.tsx": {
      content: `
      export default function UsersPage() {
        return <p>Hello World</p>;
      }`,
    },
    "modules/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: `
      export default function UserDetailsPage() {
        return <p>Hello World</p>;
      }`,
    },
  };

  await writeFileTree(testDir, mainModuleFileTree);

  const workspace = await project.analyze();

  t.is(workspace.clients.length, 1);

  t.deepEqual(workspace.clients[0].routes, {
    name: "IndexPage",
    pageImportPath: null,
    layoutImportPath: null,
    placeholderImportPath: null,
    guardImportPath: null,
    urlPath: null,
    children: [
      {
        name: "IndexPage",
        pageImportPath: "@/main/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
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
      {
        name: "NotFoundPage",
        pageImportPath: "@/main/client/pages/404/not-found-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/*",
        children: [],
      },
    ],
  });
});

test("update-runtime", async (t) => {
  const project = new Project({ rootDir: testDir });

  await project.init({
    projectName: "ava-test",
    projectDescription: "Test Ava project",
    projectVersion: "0.1.0",
    projectAuthor: "Kwame",
  });

  const fileTree = {
    "modules/main/client/pages/index-page.tsx": {
      content: `
        export default function IndexPage() {
          return <p>Hello World</p>;
        }`,
    },
    "modules/main/client/pages/(public)/landing/landing-page.tsx": {
      content: `
        const LandingPage = () => {
          return <p>Hello World</p>;
        };
        
        export default LandingPage
        `,
    },
    "modules/main/client/pages/(public)/contact/contact-page.tsx": {
      content: `
        function ContactPage() {
          return <p>Hello World</p>;
        };
        
        export default ContactPage
      `,
    },
    "modules/main/client/pages/(public)/features/features-page.tsx": {
      content: `
        export default function FeaturesPage() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/main/client/pages/(dashboard)/dashboard-layout.tsx": {
      content: `
        export default function DashboardLayout() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/main/client/pages/(dashboard)/users/users-page.tsx": {
      content: `
        export default function UsersPage() {
          return <p>Hello World</p>;
        }
      `,
    },
    "modules/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx": {
      content: `
        export default function UserDetailsPage() {
          return <p>Hello World</p>;
        }
      `,
    },
  };

  await writeFileTree(testDir, fileTree);

  const pagesDir = resolve(testDir, "modules/main/client/pages");
  t.true(fs.existsSync(resolve(pagesDir, "index-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/landing/landing-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/contact/contact-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(public)/features/features-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/dashboard-layout.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/users-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/[userId]/user-details-page.tsx")));

  const runtime = await project.analyze();
  const changes = runtime.diffFrom(null);
  await project.updateRuntime(changes);

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
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/router.tsx")));

  const routerSource = fs.readFileSync(resolve(runtimeMainDir, "src/router.tsx"), {
    encoding: "utf-8",
  });

  t.is(
    routerSource,
    await format(
      `
        import { type ReactNode, lazy, Suspense } from "react";
        import { createBrowserRouter } from "react-router";
        
        const IndexPage = lazy(() => import("@/main/client/pages/index-page.tsx"));
        import DashboardGroupLayout from "@/main/client/pages/(dashboard)/dashboard-layout.tsx";
        const UsersPage = lazy(() => import("@/main/client/pages/(dashboard)/users/users-page.tsx"));
        const UserDetailsPage = lazy(() => import("@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx"));
        const ContactPage = lazy(() => import("@/main/client/pages/(public)/contact/contact-page.tsx"));
        const FeaturesPage = lazy(() => import("@/main/client/pages/(public)/features/features-page.tsx"));
        const LandingPage = lazy(() => import("@/main/client/pages/(public)/landing/landing-page.tsx"));
        const NotFoundPage = lazy(() => import("@/main/client/pages/404/not-found-page.tsx"));
        function withSuspense(child: ReactNode, placeholder?: ReactNode) {
          return (
            <Suspense
              fallback={
                <div className="w-screen h-full grid place-items-center">
                  {placeholder ?? <p>Please wait</p>}
                </div>
              }>
              {child}
            </Suspense>
          );
        }
        
        export default createBrowserRouter([
          {
            children: [
              { id: "IndexPage", path: "/", element: withSuspense(<IndexPage />) },
              {
                id: "DashboardGroupLayout",
                element: <DashboardGroupLayout />,
                children: [
                  {
                    id: "UsersPage",
                    path: "/users",
                    element: withSuspense(<UsersPage />),
                    children: [
                      {
                        id: "UserDetailsPage",
                        path: "/users/:userId",
                        element: withSuspense(<UserDetailsPage />),
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
                    element: withSuspense(<ContactPage />),
                  },
                  {
                    id: "FeaturesPage",
                    path: "/features",
                    element: withSuspense(<FeaturesPage />),
                  },
                  {
                    id: "LandingPage",
                    path: "/landing",
                    element: withSuspense(<LandingPage />),
                  },
                ],
              },
              {
                id: "NotFoundPage",
                path: "/*",
                element: withSuspense(<NotFoundPage />),
              },
            ],
          },
        ]);
      `,
      getPrettierConfig({ filePath: "a.tsx" }),
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
