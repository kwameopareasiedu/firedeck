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
        name: "admin",
        routes: {
          pageImportPath: "@/admin/client/pages/index-page.tsx",
          layoutImportPath: null,
          placeholderImportPath: null,
          guardImportPath: null,
          urlPath: "/",
          children: [],
        },
        htmlHash: 0xa88980,
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
        htmlHash: 0x654321,
      },
    ],
  });

  const r1r2Changes = r2.diffFrom(r1);
  const r1r3Changes = r3.diffFrom(r1);
  const r1r4Changes = r4.diffFrom(r1);
  const nullR4Changes = r4.diffFrom(null);

  t.deepEqual(r1r2Changes, [
    {
      type: "update-runtime-client-routes",
      clientName: "main",
      clientRoutes: {
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
    {
      type: "update-client-sdk-routes",
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
    },
  ]);

  t.deepEqual(r1r3Changes, [
    { type: "remove-runtime-client", clientName: "main" },
    { type: "update-client-sdk-routes", clients: [] },
  ]);

  t.deepEqual(r1r4Changes, [
    { type: "add-runtime-client", clientName: "admin" },
    {
      type: "update-runtime-client-routes",
      clientName: "admin",
      clientRoutes: {
        pageImportPath: "@/admin/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
    },
    { type: "update-runtime-client-html", clientName: "admin" },
    { type: "add-runtime-client", clientName: "external" },
    {
      type: "update-runtime-client-routes",
      clientName: "external",
      clientRoutes: {
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
    },
    { type: "update-runtime-client-html", clientName: "external" },
    { type: "remove-runtime-client", clientName: "main" },
    {
      type: "update-client-sdk-routes",
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
          htmlHash: 0xa88980,
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
          htmlHash: 0x654321,
        },
      ],
    },
  ]);

  t.deepEqual(nullR4Changes, [
    { type: "create-runtime" },
    { type: "add-runtime-client", clientName: "admin" },
    {
      type: "update-runtime-client-routes",
      clientName: "admin",
      clientRoutes: {
        pageImportPath: "@/admin/client/pages/index-page.tsx",
        layoutImportPath: null,
        placeholderImportPath: null,
        guardImportPath: null,
        urlPath: "/",
        children: [],
      },
    },
    { type: "update-runtime-client-html", clientName: "admin" },
    { type: "add-runtime-client", clientName: "external" },
    {
      type: "update-runtime-client-routes",
      clientName: "external",
      clientRoutes: {
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
    },
    { type: "update-runtime-client-html", clientName: "external" },
    {
      type: "update-client-sdk-routes",
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
          htmlHash: 0xa88980,
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
          htmlHash: 0x654321,
        },
      ],
    },
  ]);
});
