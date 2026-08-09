import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { init } from "../temp/init.js";
import { analyzeProject } from "../temp/analyze-project.js";
import { compareProjects } from "../temp/compare-projects.js";
import { applyProjectMutations } from "../temp/apply-project-mutations.js";
import { getPrettierConfig, writeFileTree } from "../temp/utils.js";
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
    ".env": {
      content: `
MAIN__VITE_HELLO=world
MAIN__VITE_FOO=bar
API__DB_URL=postgres://user:pass@localhost:5173/db
      `,
    },
    "modules/client/main/public/scatter.txt": {
      content: "scatter-plot:data",
      extension: null,
    },
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
        import { Outlet } from "react-router";

        export default function UsersPage() {
          return <Outlet />;
        }
      `,
    },
    "modules/client/main/pages/(dashboard)/users/users-layout.tsx": {
      content: `
        import { Outlet } from "react-router";

        export default function UsersPage() {
          return <Outlet />;
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
    "modules/backend/api/functions/get-users.ts": {
      content: `
        import {onCall} from "firebase-functions/v2/https";
        
        export default onCall(async function getUser(req) {
          return [];
        });
      `,
    },
    "modules/backend/api/functions/create-user.ts": {
      content: `
        import {onCall} from "firebase-functions/v2/https";
        
        export default onCall(async function createUser(req) {
          return true;
        });
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
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/users-layout.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/users-page.tsx")));
  t.true(fs.existsSync(resolve(pagesDir, "(dashboard)/users/[userId]/user-details-page.tsx")));

  const publicDir = resolve(testDir, "modules/client/main/public");
  t.true(fs.existsSync(resolve(publicDir, "favicon.svg")));
  t.true(fs.existsSync(resolve(publicDir, "scatter.txt")));

  const functionsDir = resolve(testDir, "modules/backend/api/functions");
  t.true(fs.existsSync(resolve(functionsDir, "get-users.ts")));
  t.true(fs.existsSync(resolve(functionsDir, "create-user.ts")));

  const project = await analyzeProject(testDir, "dev");
  const mutations = compareProjects(null, project);
  await applyProjectMutations(testDir, project, mutations);

  const workspaceDir = resolve(testDir, "firedeck");
  t.true(fs.existsSync(resolve(workspaceDir, "env-client.d.ts")));
  t.true(fs.existsSync(resolve(workspaceDir, "env-backend.d.ts")));

  const workspaceClientEnvTypesSource = fs.readFileSync(
    resolve(testDir, "firedeck/env-client.d.ts"),
    { encoding: "utf-8" },
  );

  t.is(
    workspaceClientEnvTypesSource,
    await format(
      `
      interface ViteTypeOptions {
        strictImportMetaEnv: unknown;
      }

      interface ImportMetaEnv {
        readonly VITE_HELLO: "world";
        readonly VITE_FOO: "bar";
      }
      
      interface ImportMeta {
        readonly env: ImportMetaEnv;
      }`,
      getPrettierConfig({ filePath: "a.ts" }),
    ),
  );

  const runtimeDir = resolve(testDir, "firedeck/runtime");
  t.true(fs.existsSync(resolve(runtimeDir, ".firebaserc")));
  t.true(fs.existsSync(resolve(runtimeDir, "firebase.json")));
  t.true(fs.existsSync(resolve(runtimeDir, "firestore.json")));
  t.true(fs.existsSync(resolve(runtimeDir, "firestore.rules")));
  t.true(fs.existsSync(resolve(runtimeDir, "storage.rules")));

  const runtimeMainDir = resolve(testDir, "firedeck/runtime/modules/main");
  t.true(fs.existsSync(resolve(runtimeMainDir, ".env")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "package.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.app.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.node.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "tsconfig.json")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "vite.config.ts")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "index.html")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "global.d.ts")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "public/favicon.svg")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "public/scatter.txt")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/index.tsx")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/index.css")));
  t.true(fs.existsSync(resolve(runtimeMainDir, "src/routes.ts")));

  const runtimeMainEnvSource = fs.readFileSync(resolve(runtimeMainDir, ".env"), {
    encoding: "utf-8",
  });

  t.is(
    runtimeMainEnvSource,
    `VITE_HELLO=world
VITE_FOO=bar`,
  );

  const runtimeApiDir = resolve(testDir, "firedeck/runtime/modules/api");
  t.true(fs.existsSync(resolve(runtimeApiDir, ".env")));
  t.true(fs.existsSync(resolve(runtimeApiDir, "package.json")));
  t.true(fs.existsSync(resolve(runtimeApiDir, "tsconfig.json")));
  t.true(fs.existsSync(resolve(runtimeApiDir, "rollup.config.mjs")));
  t.true(fs.existsSync(resolve(runtimeApiDir, "src/index.ts")));
  t.true(fs.existsSync(resolve(runtimeApiDir, "src/functions.ts")));

  const runtimeAiEnvSource = fs.readFileSync(resolve(runtimeApiDir, ".env"), {
    encoding: "utf-8",
  });

  t.is(runtimeAiEnvSource, "DB_URL=postgres://user:pass@localhost:5173/db");

  const routesSource = fs.readFileSync(resolve(runtimeMainDir, "src/routes.ts"), {
    encoding: "utf-8",
  });

  t.is(
    routesSource,
    await format(
      `export default [
        {
          path: "/",
          children: [
            {
              index: true,
              id: "IndexPage",
              lazy: { Component: () => import("@/client/main/pages/index-page.tsx").then((mod) => mod.default) },
            },
            {
              id: "DashboardLayout",
              lazy: { Component: () => import("@/client/main/pages/(dashboard)/dashboard-layout.tsx").then((mod) => mod.default) },
              children: [
                {
                  id: "UsersLayout",
                  path: "/users",
                  lazy: { Component: () => import("@/client/main/pages/(dashboard)/users/users-layout.tsx").then((mod) => mod.default) },
                  children: [
                    {
                      index: true,
                      id: "UsersPage",
                      lazy: { Component: () => import("@/client/main/pages/(dashboard)/users/users-page.tsx").then((mod) => mod.default) },
                    },
                    {
                      path: "/users/:userId",
                      children: [
                        {
                          index: true,
                          id: "UserDetailsPage",
                          lazy: { Component: () => import("@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx").then((mod) => mod.default) },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              children: [
                {
                  path: "/contact",
                  children: [
                    {
                      index: true,
                      id: "ContactPage",
                      lazy: { Component: () => import("@/client/main/pages/(public)/contact/contact-page.tsx").then((mod) => mod.default) },
                    },
                  ],
                },
                {
                  path: "/features",
                  children: [
                    {
                      index: true,
                      id: "FeaturesPage",
                      lazy: { Component: () => import("@/client/main/pages/(public)/features/features-page.tsx").then((mod) => mod.default) },
                    },
                  ],
                },
                {
                  path: "/landing",
                  children: [
                    {
                      index: true,
                      id: "LandingPage",
                      lazy: { Component: () => import("@/client/main/pages/(public)/landing/landing-page.tsx").then((mod) => mod.default) },
                    },
                  ],
                },
              ],
            },
            {
              id: "NotFoundPage",
              path: "/*",
              lazy: {
                Component: () => import("@/client/main/pages/404/not-found-page.tsx").then((mod) => mod.default),
              },
            },
          ],
        },
      ];`,
      getPrettierConfig({ filePath: "a.ts" }),
    ),
  );

  const functionsSource = fs.readFileSync(resolve(runtimeApiDir, "src/functions.ts"), {
    encoding: "utf-8",
  });

  t.is(
    functionsSource,
    await format(
      `import apiCreateUser from "@/backend/api/functions/create-user.ts";
      import apiGetUsers from "@/backend/api/functions/get-users.ts";
      import apiHello from "@/backend/api/functions/hello.ts";
      
      export { apiCreateUser, apiGetUsers, apiHello };`,
      getPrettierConfig({ filePath: "a.ts" }),
    ),
  );

  const clientSdkDir = resolve(testDir, "firedeck/client-sdk");
  t.true(fs.existsSync(resolve(clientSdkDir, "main.ts")));

  const generatedMainSdkSource = fs.readFileSync(resolve(clientSdkDir, "main.ts"), {
    encoding: "utf-8",
  });

  t.is(
    generatedMainSdkSource,
    await format(
      `
      /**
       * ------------------------------------------------
       * This file was generated by Firedeck. Do not edit
       * ------------------------------------------------
       */
      
      import { initializeApp } from "firebase/app";
      import { browserSessionPersistence, initializeAuth } from "firebase/auth";
      import { initializeFirestore } from "firebase/firestore";
      import { getFunctions, httpsCallable } from "firebase/functions";
      import { getStorage } from "firebase/storage";
      import { initializeAnalytics } from "firebase/analytics";
      import type { CallableFunction } from "firebase-functions/https";
      
      type GetBackendFnArgs<T> =
        T extends CallableFunction<infer A, unknown> ? A : never;
      type GetBackendFnReturn<T> =
        T extends CallableFunction<unknown, infer R> ? R : never;
      
      const firebaseConfig = {
        apiKey: "demo-firedeck-api-key",
        authDomain: "demo-firedeck.firebaseapp.com",
        projectId: "demo-firedeck",
        storageBucket: "demo-firedeck.firebasestorage.app",
        messagingSenderId: "demo-firedeck-messaging-sender-id",
        appId: "demo-firedeck-app-id",
        measurementId: "demo-firedeck-measurement-id",
        projectNumber: "123456789",
        version: "2",
      };
      
      // Initialize Firebase
      export const app = initializeApp(firebaseConfig);
      export const auth = initializeAuth(app, {
        persistence: browserSessionPersistence,
      });
      export const firestore = initializeFirestore(app, {});
      export const functions = getFunctions(app);
      export const storage = getStorage(app);
      export const analytics = initializeAnalytics(app);
      
      import apiCreateUserFn from "@/backend/api/functions/create-user.ts";
      type ArgOfApiCreateUser = GetBackendFnArgs<typeof apiCreateUserFn>;
      type RetOfApiCreateUser = GetBackendFnReturn<typeof apiCreateUserFn>;
      
      export async function callApiCreateUser(args: ArgOfApiCreateUser) {
        return httpsCallable<typeof args, Awaited<RetOfApiCreateUser>>(
          functions,
          "apiCreateUser",
        )(args).then((res) => res.data);
      }
      
      import apiGetUsersFn from "@/backend/api/functions/get-users.ts";
      type ArgOfApiGetUsers = GetBackendFnArgs<typeof apiGetUsersFn>;
      type RetOfApiGetUsers = GetBackendFnReturn<typeof apiGetUsersFn>;
      
      export async function callApiGetUsers(args: ArgOfApiGetUsers) {
        return httpsCallable<typeof args, Awaited<RetOfApiGetUsers>>(
          functions,
          "apiGetUsers",
        )(args).then((res) => res.data);
      }
      
      import apiHelloFn from "@/backend/api/functions/hello.ts";
      type ArgOfApiHello = GetBackendFnArgs<typeof apiHelloFn>;
      type RetOfApiHello = GetBackendFnReturn<typeof apiHelloFn>;
      
      export async function callApiHello(args: ArgOfApiHello) {
        return httpsCallable<typeof args, Awaited<RetOfApiHello>>(
          functions,
          "apiHello",
        )(args).then((res) => res.data);
      }
      
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
