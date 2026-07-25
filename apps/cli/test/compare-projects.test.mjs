import test from "ava";
import { compareProjects } from "../temp/compare-projects.js";

test("compare-projects", async (t) => {
  const p1 = {
    config: {},
    clients: [
      {
        name: "main",
        routes: {
          name: "IndexPage",
          pageImportPath: null,
          layoutImportPath: null,
          placeholderImportPath: null,
          beforeImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/client/main/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              beforeImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main/pages/(dashboard)/dashboard-layout.tsx",
              urlPath: null,
              placeholderImportPath: null,
              beforeImportPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      beforeImportPath: null,
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
              beforeImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "ContactPage",
                  pageImportPath: "@/client/main/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/client/main/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main/pages/(public)/landing/landing-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
        indexHtml: "<main>Main</main>",
        publicLastModifiedTs: 1234564,
        env: "",
      },
    ],
    backends: [
      {
        name: "api",
        functions: [
          { name: "hello", importPath: "@/backend/api/functions/hello.ts" },
          { name: "getUserData", importPath: "@/backend/api/functions/get-user-data.ts" },
        ],
        env: "",
      },
    ],
  };

  const p2 = {
    config: {},
    clients: [
      {
        name: "main",
        routes: {
          name: "IndexPage",
          pageImportPath: null,
          layoutImportPath: null,
          placeholderImportPath: null,
          beforeImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/client/main/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              beforeImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              beforeImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      beforeImportPath: null,
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
              beforeImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/client/main/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main/pages/(public)/landing/landing-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
        indexHtml: "<main>Main</main>",
        publicLastModifiedTs: 1234564,
        env: "",
      },
    ],
    backends: [
      {
        name: "api",
        functions: [
          { name: "hello", importPath: "@/backend/api/functions/hello.ts" },
          { name: "getUserData", importPath: "@/backend/api/functions/get-user-data.ts" },
        ],
        env: "",
      },
    ],
  };

  const p3 = {
    config: { vite: async () => ({}) },
    clients: [],
    backends: [
      {
        name: "api",
        functions: [
          { name: "foo", importPath: "@/backend/api/functions/foo.ts" },
          { name: "getUserData", importPath: "@/backend/api/functions/get-user-data.ts" },
        ],
        env: "",
      },
      {
        name: "admin",
        functions: [
          { name: "getUsers", importPath: "@/backend/admin/functions/get-users.ts" },
          { name: "createUser", importPath: "@/backend/admin/functions/create-user.ts" },
        ],
        env: "",
      },
    ],
  };

  const p4 = {
    config: { firebase: { projects: {} } },
    clients: [
      {
        name: "admin",
        routes: {
          pageImportPath: "@/admin/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          beforeImportPath: null,
          urlPath: "/",
          children: [],
        },
        indexHtml: "<main>Amin</main>",
        publicLastModifiedTs: 31312,
        env: "VITE_FOO=bar",
      },
      {
        name: "external",
        routes: {
          name: "IndexPage",
          pageImportPath: null,
          layoutImportPath: null,
          placeholderImportPath: null,
          beforeImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/external/client/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              beforeImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/external/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              beforeImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/external/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/external/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
                      layoutImportPath: null,
                      placeholderImportPath: null,
                      beforeImportPath: null,
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
              beforeImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "ContactPage",
                  pageImportPath: "@/external/client/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/external/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/external/client/pages/(public)/landing/landing-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  beforeImportPath: null,
                  urlPath: "/landing",
                  children: [],
                },
              ],
            },
          ],
        },
        indexHtml: "<main>Amin</main>",
        publicLastModifiedTs: 456534,
        env: "VITE_WEATHER=sunny",
      },
    ],
    backends: [],
  };

  const p1p2Changes = compareProjects(p1, p2);
  const p1p3Changes = compareProjects(p1, p3);
  const p1p4Changes = compareProjects(p1, p4);
  const nullP4Changes = compareProjects(null, p4);

  // console.dir(p1p4Changes, { depth: null });

  t.deepEqual(p1p2Changes, [{ type: "update-runtime-client-sdk", clientName: "main" }]);

  t.deepEqual(p1p3Changes, [
    { type: "remove-runtime-client", clientName: "main" },
    { type: "update-runtime-backend-functions", backendName: "api" },
    { type: "add-runtime-backend", backendName: "admin" },
    { type: "update-runtime-backend-functions", backendName: "admin" },
    { type: "update-runtime-backend-env", backendName: "admin" },
    { type: "update-workspace-env-types" },
    { type: "update-runtime" },
  ]);

  t.deepEqual(p1p4Changes, [
    { type: "add-runtime-client", clientName: "admin" },
    { type: "update-runtime-client-sdk", clientName: "admin" },
    { type: "update-runtime-client-html", clientName: "admin" },
    { type: "update-runtime-client-env", clientName: "admin" },
    { type: "update-runtime-client-public-dir", clientName: "admin" },
    { type: "add-runtime-client", clientName: "external" },
    { type: "update-runtime-client-sdk", clientName: "external" },
    { type: "update-runtime-client-html", clientName: "external" },
    { type: "update-runtime-client-env", clientName: "external" },
    { type: "update-runtime-client-public-dir", clientName: "external" },
    { type: "remove-runtime-client", clientName: "main" },
    { type: "remove-runtime-backend", backendName: "api" },
    { type: "update-workspace-env-types" },
    { type: "update-runtime" },
  ]);

  t.deepEqual(nullP4Changes, [
    { type: "create-runtime" },
    { type: "add-runtime-client", clientName: "admin" },
    { type: "update-runtime-client-sdk", clientName: "admin" },
    { type: "update-runtime-client-html", clientName: "admin" },
    { type: "update-runtime-client-env", clientName: "admin" },
    { type: "update-runtime-client-public-dir", clientName: "admin" },
    { type: "add-runtime-client", clientName: "external" },
    { type: "update-runtime-client-sdk", clientName: "external" },
    { type: "update-runtime-client-html", clientName: "external" },
    { type: "update-runtime-client-env", clientName: "external" },
    { type: "update-runtime-client-public-dir", clientName: "external" },
    { type: "update-workspace-env-types" },
    { type: "update-runtime" },
  ]);
});
