import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { Runtime } from "../temp/runtime.js";

const __dirname = import.meta.dirname;
const testRoot = resolve(__dirname, "../temp/testing");

test.beforeEach(() => {
  fs.removeSync(testRoot);
  fs.ensureDirSync(testRoot);
});

test("runtime-diff", async (t) => {
  const r1 = new Runtime({
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
        htmlHash: 0x123456,
      },
    ],
  });

  const r2 = new Runtime({
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
        htmlHash: 0x123456,
      },
    ],
  });

  const r3 = new Runtime({
    clients: [],
  });

  const r4 = new Runtime({
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
        htmlHash: 0x654321,
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
        htmlHash: 0xa88980,
      },
    ],
  });

  const w1w2Changes = r2.diffFrom(r1);
  const w1w3Changes = r3.diffFrom(r1);
  const w1w4Changes = r4.diffFrom(r1);
  const nullW4Changes = r4.diffFrom(null);

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
    { type: "update-client-html", clientName: "admin" },
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
    { type: "update-client-html", clientName: "admin" },
  ]);
});
