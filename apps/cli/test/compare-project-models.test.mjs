import test from "ava";
import { compareProjectModels } from "../temp/compare-project-models.js";

test("compare-project-models", async (t) => {
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
          guardImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/client/main/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main/pages/(dashboard)/dashboard-layout.tsx",
              urlPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
                  pageImportPath: "@/client/main/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/client/main/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main/pages/(public)/landing/landing-page.tsx",
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
        indexHtml: "<main>Main</main>",
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
          guardImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/client/main/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
                  pageImportPath: "@/client/main/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main/pages/(public)/landing/landing-page.tsx",
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
        indexHtml: "<main>Main</main>",
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
          guardImportPath: null,
          urlPath: "/",
          children: [],
        },
        indexHtml: "<main>Amin</main>",
        env: "VITE_FOO=bar",
      },
      {
        name: "external",
        routes: {
          name: "IndexPage",
          pageImportPath: null,
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: null,
          children: [
            {
              name: "IndexPage",
              pageImportPath: "@/external/client/pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/external/client/pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/external/client/pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/external/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
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
                  pageImportPath: "@/external/client/pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/external/client/pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/external/client/pages/(public)/landing/landing-page.tsx",
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
        indexHtml: "<main>Amin</main>",
        env: "VITE_WEATHER=sunny",
      },
    ],
    backends: [],
  };

  const p1p2Changes = compareProjectModels(p1, p2);
  const p1p3Changes = compareProjectModels(p1, p3);
  const p1p4Changes = compareProjectModels(p1, p4);
  const nullP4Changes = compareProjectModels(null, p4);

  // console.dir(p1p4Changes, { depth: null });

  t.deepEqual(p1p2Changes, [
    {
      type: "update-runtime-client-routes",
      clientName: p2.clients[0].name,
      clientRoutes: p2.clients[0].routes,
    },
    {
      type: "update-client-sdk-routes",
      clients: p2.clients,
    },
  ]);

  t.deepEqual(p1p3Changes, [
    { type: "remove-runtime-client", clientName: p1.clients[0].name },
    {
      type: "update-runtime-backend-functions",
      backendName: p3.backends[0].name,
      backendFunctions: p3.backends[0].functions,
    },
    { type: "add-runtime-backend", backendName: p3.backends[1].name },
    {
      type: "update-runtime-backend-functions",
      backendName: p3.backends[1].name,
      backendFunctions: p3.backends[1].functions,
    },
    {
      type: "update-runtime-backend-env",
      backendName: p3.backends[1].name,
      env: p3.backends[1].env,
    },
    { type: "update-workspace-env-types", clients: p3.clients },
    {
      type: "update-runtime-firebase-config",
      config: p3.config,
      clients: p3.clients,
      backends: p3.backends,
    },
    { type: "update-client-sdk-routes", clients: p3.clients },
    { type: "update-client-sdk-api", clients: p3.clients, backends: p3.backends },
  ]);

  t.deepEqual(p1p4Changes, [
    { type: "add-runtime-client", clientName: p4.clients[0].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[0].name,
      clientRoutes: p4.clients[0].routes,
    },
    {
      type: "update-runtime-client-html",
      clientName: p4.clients[0].name,
      html: p4.clients[0].indexHtml,
    },
    { type: "update-runtime-client-env", clientName: p4.clients[0].name, env: p4.clients[0].env },
    { type: "add-runtime-client", clientName: p4.clients[1].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[1].name,
      clientRoutes: p4.clients[1].routes,
    },
    {
      type: "update-runtime-client-html",
      clientName: p4.clients[1].name,
      html: p4.clients[1].indexHtml,
    },
    { type: "update-runtime-client-env", clientName: p4.clients[1].name, env: p4.clients[1].env },
    { type: "remove-runtime-client", clientName: p1.clients[0].name },
    { type: "remove-runtime-backend", backendName: p1.backends[0].name },
    { type: "update-workspace-env-types", clients: p4.clients },
    {
      type: "update-runtime-firebase-config",
      config: p4.config,
      clients: p4.clients,
      backends: p4.backends,
    },
    { type: "update-client-sdk-routes", clients: p4.clients },
    { type: "update-client-sdk-api", clients: p4.clients, backends: p4.backends },
  ]);

  t.deepEqual(nullP4Changes, [
    { type: "create-runtime", config: p4.config },
    { type: "add-runtime-client", clientName: p4.clients[0].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[0].name,
      clientRoutes: p4.clients[0].routes,
    },
    {
      type: "update-runtime-client-html",
      clientName: p4.clients[0].name,
      html: p4.clients[0].indexHtml,
    },
    { type: "update-runtime-client-env", clientName: p4.clients[0].name, env: p4.clients[0].env },
    { type: "add-runtime-client", clientName: p4.clients[1].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[1].name,
      clientRoutes: p4.clients[1].routes,
    },
    {
      type: "update-runtime-client-html",
      clientName: p4.clients[1].name,
      html: p4.clients[1].indexHtml,
    },
    { type: "update-runtime-client-env", clientName: p4.clients[1].name, env: p4.clients[1].env },
    { type: "update-workspace-env-types", clients: p4.clients },
    {
      type: "update-runtime-firebase-config",
      config: p4.config,
      clients: p4.clients,
      backends: p4.backends,
    },
    { type: "update-client-sdk-routes", clients: p4.clients },
  ]);
});
