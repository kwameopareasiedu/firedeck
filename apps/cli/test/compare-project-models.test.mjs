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
              pageImportPath: "@/client/main//pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main//pages/(dashboard)/dashboard-layout.tsx",
              urlPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main//pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main//pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
                  pageImportPath: "@/client/main//pages/(public)/contact/contact-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/contact",
                  children: [],
                },
                {
                  name: "FeaturesPage",
                  pageImportPath: "@/client/main//pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main//pages/(public)/landing/landing-page.tsx",
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
              pageImportPath: "@/client/main//pages/index-page.tsx",
              layoutImportPath: null,
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: "/",
              children: [],
            },
            {
              name: "DashboardGroup",
              pageImportPath: null,
              layoutImportPath: "@/client/main//pages/(dashboard)/dashboard-layout.tsx",
              placeholderImportPath: null,
              guardImportPath: null,
              urlPath: null,
              children: [
                {
                  name: "UsersPage",
                  pageImportPath: "@/client/main//pages/(dashboard)/users/users-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/users",
                  children: [
                    {
                      name: "UserDetailsPage",
                      pageImportPath:
                        "@/client/main//pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
                  pageImportPath: "@/client/main//pages/(public)/features/features-page.tsx",
                  layoutImportPath: null,
                  placeholderImportPath: null,
                  guardImportPath: null,
                  urlPath: "/features",
                  children: [],
                },
                {
                  name: "LandingPage",
                  pageImportPath: "@/client/main//pages/(public)/landing/landing-page.tsx",
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
  };

  const p3 = {
    config: { vite: async () => ({}) },
    clients: [],
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
  };

  const p1p2Changes = compareProjectModels(p1, p2);
  const p1p3Changes = compareProjectModels(p1, p3);
  const p1p4Changes = compareProjectModels(p1, p4);
  const nullP4Changes = compareProjectModels(null, p4);

  t.deepEqual(p1p2Changes, [
    {
      type: "update-runtime-client-routes",
      clientName: p2.clients[0].name,
      clientRoutes: p2.clients[0].routes,
    },
    { type: "update-client-sdk-routes", clients: p2.clients },
  ]);

  t.deepEqual(p1p3Changes, [
    { type: "remove-runtime-client", clientName: p1.clients[0].name },
    { type: "update-runtime-envs", config: p3.config, clients: p3.clients },
    { type: "update-runtime-configs", config: p3.config, clients: p3.clients },
    { type: "update-client-sdk-routes", clients: p3.clients },
  ]);

  t.deepEqual(p1p4Changes, [
    { type: "add-runtime-client", clientName: p4.clients[0].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[0].name,
      clientRoutes: p4.clients[0].routes,
    },
    { type: "update-runtime-client-html", clientName: p4.clients[0].name },
    { type: "add-runtime-client", clientName: p4.clients[1].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[1].name,
      clientRoutes: p4.clients[1].routes,
    },
    { type: "update-runtime-client-html", clientName: p4.clients[1].name },
    { type: "remove-runtime-client", clientName: p1.clients[0].name },
    { type: "update-runtime-envs", config: p4.config, clients: p4.clients },
    { type: "update-runtime-configs", config: p4.config, clients: p4.clients },
    { type: "update-client-sdk-routes", clients: p4.clients },
  ]);

  t.deepEqual(nullP4Changes, [
    { type: "create-runtime", config: p4.config },
    { type: "add-runtime-client", clientName: p4.clients[0].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[0].name,
      clientRoutes: p4.clients[0].routes,
    },
    { type: "update-runtime-client-html", clientName: p4.clients[0].name },
    { type: "add-runtime-client", clientName: p4.clients[1].name },
    {
      type: "update-runtime-client-routes",
      clientName: p4.clients[1].name,
      clientRoutes: p4.clients[1].routes,
    },
    { type: "update-runtime-client-html", clientName: p4.clients[1].name },
    { type: "update-runtime-envs", config: p4.config, clients: p4.clients },
    { type: "update-runtime-configs", config: p4.config, clients: p4.clients },
    { type: "update-client-sdk-routes", clients: p4.clients },
  ]);
});
