import test from "ava";
import fs from "fs-extra";
import { resolve } from "node:path";
import { Project } from "../temp/project.js";
import { writeFileTree } from "../temp/utils.js";

const __dirname = import.meta.dirname;
const testDir = resolve(__dirname, "../temp/testing");
const project = new Project({ rootDir: testDir });

test.beforeEach(() => {
  fs.removeSync(testDir);
  fs.ensureDirSync(testDir);
});

test("init", async (t) => {
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
  t.true(fs.existsSync(resolve(testDir, "modules", "main")));
  t.true(fs.existsSync(resolve(testDir, "modules", "shared")));

  const packageJson = await fs.readJSONSync(resolve(testDir, "package.json"));
  t.is(packageJson.name, "ava-test");
  t.is(packageJson.description, "Test Ava project");
  t.is(packageJson.version, "0.1.0");
  t.is(packageJson.author, "Kwame");
});

test("create-module", async (t) => {
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
});

test("analyze", async (t) => {
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
                pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
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
    ],
  });
});

// test("compare-workspaces", async (t) => {
//   const analyzer = new Analyzer();
//
//   const w1 = {
//     clients: [
//       {
//         name: "main",
//         routes: {
//           name: "IndexPage",
//           pageImportPath: "@/main/client/pages/index-page.tsx",
//           layoutImportPath: null,
//           placeholderImportPath: null,
//           guardImportPath: null,
//           urlPath: "/",
//           children: [
//             {
//               name: "DashboardGroup",
//               pageImportPath: null,
//               layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//               urlPath: null,
//               placeholderImportPath: null,
//               guardImportPath: null,
//               children: [
//                 {
//                   name: "UsersPage",
//                   pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/users",
//                   children: [
//                     {
//                       name: "UserDetailsPage",
//                       pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
//                       layoutImportPath: null,
//                       placeholderImportPath: null,
//                       guardImportPath: null,
//                       urlPath: "/users/:userId",
//                       children: [],
//                     },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: null,
//               pageImportPath: null,
//               layoutImportPath: null,
//               placeholderImportPath: null,
//               guardImportPath: null,
//               urlPath: null,
//               children: [
//                 {
//                   name: "ContactPage",
//                   pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/contact",
//                   children: [],
//                 },
//                 {
//                   name: "FeaturesPage",
//                   pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/features",
//                   children: [],
//                 },
//                 {
//                   name: "LandingPage",
//                   pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/landing",
//                   children: [],
//                 },
//               ],
//             },
//           ],
//         },
//         html: { hash: 0x123456 },
//       },
//     ],
//   };
//
//   const w2 = {
//     clients: [
//       {
//         name: "main",
//         routes: {
//           name: "IndexPage",
//           pageImportPath: "@/main/client/pages/index-page.tsx",
//           layoutImportPath: null,
//           placeholderImportPath: null,
//           guardImportPath: null,
//           urlPath: "/",
//           children: [
//             {
//               name: "DashboardGroup",
//               pageImportPath: null,
//               layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//               placeholderImportPath: null,
//               guardImportPath: null,
//               urlPath: null,
//               children: [
//                 {
//                   name: "UsersPage",
//                   pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/users",
//                   children: [
//                     {
//                       name: "UserDetailsPage",
//                       pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
//                       layoutImportPath: null,
//                       placeholderImportPath: null,
//                       guardImportPath: null,
//                       urlPath: "/users/:userId",
//                       children: [],
//                     },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: null,
//               pageImportPath: null,
//               layoutImportPath: null,
//               placeholderImportPath: null,
//               guardImportPath: null,
//               urlPath: null,
//               children: [
//                 {
//                   name: "FeaturesPage",
//                   pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/features",
//                   children: [],
//                 },
//                 {
//                   name: "LandingPage",
//                   pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/landing",
//                   children: [],
//                 },
//               ],
//             },
//           ],
//         },
//         html: { hash: 0x123456 },
//       },
//     ],
//   };
//
//   const w3 = {
//     clients: [],
//   };
//
//   const w4 = {
//     clients: [
//       {
//         name: "external",
//         routes: {
//           name: "IndexPage",
//           pageImportPath: "@/main/client/pages/index-page.tsx",
//           layoutImportPath: null,
//           placeholderImportPath: null,
//           guardImportPath: null,
//           urlPath: "/",
//           children: [
//             {
//               name: "DashboardGroup",
//               pageImportPath: null,
//               layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//               placeholderImportPath: null,
//               guardImportPath: null,
//               urlPath: null,
//               children: [
//                 {
//                   name: "UsersPage",
//                   pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/users",
//                   children: [
//                     {
//                       name: "UserDetailsPage",
//                       pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
//                       layoutImportPath: null,
//                       placeholderImportPath: null,
//                       guardImportPath: null,
//                       urlPath: "/users/:userId",
//                       children: [],
//                     },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: null,
//               pageImportPath: null,
//               layoutImportPath: null,
//               placeholderImportPath: null,
//               guardImportPath: null,
//               urlPath: null,
//               children: [
//                 {
//                   name: "ContactPage",
//                   pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/contact",
//                   children: [],
//                 },
//                 {
//                   name: "FeaturesPage",
//                   pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/features",
//                   children: [],
//                 },
//                 {
//                   name: "LandingPage",
//                   pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                   layoutImportPath: null,
//                   placeholderImportPath: null,
//                   guardImportPath: null,
//                   urlPath: "/landing",
//                   children: [],
//                 },
//               ],
//             },
//           ],
//         },
//         html: { hash: 0x654321 },
//       },
//       {
//         name: "admin",
//         routes: {
//           pageImportPath: "@/main/client/pages/index-page.tsx",
//           layoutImportPath: null,
//           placeholderImportPath: null,
//           guardImportPath: null,
//           urlPath: "/",
//           children: [],
//         },
//         html: { hash: 0xa88980 },
//       },
//     ],
//   };
//
//   const w1w2Changes = analyzer.compareWorkspaces(w1, w2);
//   const w1w3Changes = analyzer.compareWorkspaces(w1, w3);
//   const w1w4Changes = analyzer.compareWorkspaces(w1, w4);
//   const nullW4Changes = analyzer.compareWorkspaces(null, w4);
//
//   t.deepEqual(w1w2Changes, [
//     {
//       type: "update-client-routes",
//       clientName: "main",
//       clientRoutes: {
//         name: "IndexPage",
//         pageImportPath: "@/main/client/pages/index-page.tsx",
//         layoutImportPath: null,
//         placeholderImportPath: null,
//         guardImportPath: null,
//         urlPath: "/",
//         children: [
//           {
//             name: "DashboardGroup",
//             pageImportPath: null,
//             layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "UsersPage",
//                 pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/users",
//                 children: [
//                   {
//                     name: "UserDetailsPage",
//                     pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-details-page.tsx",
//                     layoutImportPath: null,
//                     placeholderImportPath: null,
//                     guardImportPath: null,
//                     urlPath: "/users/:userId",
//                     children: [],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             name: null,
//             pageImportPath: null,
//             layoutImportPath: null,
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "FeaturesPage",
//                 pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/features",
//                 children: [],
//               },
//               {
//                 name: "LandingPage",
//                 pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/landing",
//                 children: [],
//               },
//             ],
//           },
//         ],
//       },
//     },
//   ]);
//
//   t.deepEqual(w1w3Changes, [{ type: "remove-client", clientName: "main" }]);
//
//   t.deepEqual(w1w4Changes, [
//     { type: "rename-client", oldClientName: "main", newClientName: "external" },
//     {
//       type: "update-client-routes",
//       clientName: "external",
//       clientRoutes: {
//         name: "IndexPage",
//         pageImportPath: "@/main/client/pages/index-page.tsx",
//         layoutImportPath: null,
//         placeholderImportPath: null,
//         guardImportPath: null,
//         urlPath: "/",
//         children: [
//           {
//             name: "DashboardGroup",
//             pageImportPath: null,
//             layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "UsersPage",
//                 pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/users",
//                 children: [
//                   {
//                     name: "UserDetailsPage",
//                     pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
//                     layoutImportPath: null,
//                     placeholderImportPath: null,
//                     guardImportPath: null,
//                     urlPath: "/users/:userId",
//                     children: [],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             name: null,
//             pageImportPath: null,
//             layoutImportPath: null,
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "ContactPage",
//                 pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/contact",
//                 children: [],
//               },
//               {
//                 name: "FeaturesPage",
//                 pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/features",
//                 children: [],
//               },
//               {
//                 name: "LandingPage",
//                 pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/landing",
//                 children: [],
//               },
//             ],
//           },
//         ],
//       },
//     },
//     { type: "update-client-html", clientName: "external" },
//     { type: "add-client", clientName: "admin" },
//     {
//       type: "update-client-routes",
//       clientName: "admin",
//       clientRoutes: {
//         pageImportPath: "@/main/client/pages/index-page.tsx",
//         layoutImportPath: null,
//         placeholderImportPath: null,
//         guardImportPath: null,
//         urlPath: "/",
//         children: [],
//       },
//     },
//     { type: "update-client-html", clientName: "admin" },
//   ]);
//
//   t.deepEqual(nullW4Changes, [
//     { type: "create-runtime" },
//     { type: "add-client", clientName: "external" },
//     {
//       type: "update-client-routes",
//       clientName: "external",
//       clientRoutes: {
//         name: "IndexPage",
//         pageImportPath: "@/main/client/pages/index-page.tsx",
//         layoutImportPath: null,
//         placeholderImportPath: null,
//         guardImportPath: null,
//         urlPath: "/",
//         children: [
//           {
//             name: "DashboardGroup",
//             pageImportPath: null,
//             layoutImportPath: "@/main/client/pages/(dashboard)/dashboard-layout.tsx",
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "UsersPage",
//                 pageImportPath: "@/main/client/pages/(dashboard)/users/users-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/users",
//                 children: [
//                   {
//                     name: "UserDetailsPage",
//                     pageImportPath: "@/main/client/pages/(dashboard)/users/[userId]/user-detail-page.tsx",
//                     layoutImportPath: null,
//                     placeholderImportPath: null,
//                     guardImportPath: null,
//                     urlPath: "/users/:userId",
//                     children: [],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             name: null,
//             pageImportPath: null,
//             layoutImportPath: null,
//             placeholderImportPath: null,
//             guardImportPath: null,
//             urlPath: null,
//             children: [
//               {
//                 name: "ContactPage",
//                 pageImportPath: "@/main/client/pages/(public)/contact/contact-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/contact",
//                 children: [],
//               },
//               {
//                 name: "FeaturesPage",
//                 pageImportPath: "@/main/client/pages/(public)/features/features-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/features",
//                 children: [],
//               },
//               {
//                 name: "LandingPage",
//                 pageImportPath: "@/main/client/pages/(public)/landing/landing-page.tsx",
//                 layoutImportPath: null,
//                 placeholderImportPath: null,
//                 guardImportPath: null,
//                 urlPath: "/landing",
//                 children: [],
//               },
//             ],
//           },
//         ],
//       },
//     },
//     { type: "update-client-html", clientName: "external" },
//     { type: "add-client", clientName: "admin" },
//     {
//       type: "update-client-routes",
//       clientName: "admin",
//       clientRoutes: {
//         pageImportPath: "@/main/client/pages/index-page.tsx",
//         layoutImportPath: null,
//         placeholderImportPath: null,
//         guardImportPath: null,
//         urlPath: "/",
//         children: [],
//       },
//     },
//     { type: "update-client-html", clientName: "admin" },
//   ]);
// });
