import fs from "fs-extra";
import { FileTree, ProjectClient, ProjectMutation, ProjectRoute, RouterRoute } from "@/types";
import {
  assertFiredeckRootDir,
  getPrettierConfig,
  getProjectPaths,
  NOT_FOUND_URL_PATH,
  writeFileTree,
} from "@/utils";
import { parseFiredeckConfig } from "@/analyze-project";
import { resolve } from "node:path";
import { format } from "prettier";
import { snakeCase, startCase } from "lodash";

export async function applyProjectMutations(rootDir: string, mutations: ProjectMutation[]) {
  assertFiredeckRootDir(rootDir);

  const firedeckConfig = await parseFiredeckConfig(rootDir);
  const { modulesDir, runtimeDir, runtimeModulesDir, clientSdkDir } = getProjectPaths(rootDir);

  for (const mutation of mutations) {
    switch (mutation.type) {
      case "create-runtime": {
        fs.removeSync(runtimeDir);
        fs.ensureDirSync(runtimeDir);

        const runtimeFileTree = generateRuntimeFileTree({
          packageManagerName: firedeckConfig.packageManager.name,
          packageManagerVersion: firedeckConfig.packageManager.version,
        });
        await writeFileTree(runtimeDir, runtimeFileTree);
        break;
      }
      case "update-config": {
        // TODO: Generate config files
        break;
      }
      case "add-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mutation.clientName);
        const clientFileTree = generateRuntimeClientFileTree({ clientName: mutation.clientName });
        await writeFileTree(clientRoot, clientFileTree);
        break;
      }
      case "remove-runtime-client": {
        const clientRoot = resolve(runtimeModulesDir, mutation.clientName);
        fs.removeSync(clientRoot);
        break;
      }
      case "rename-runtime-client": {
        const oldClientRoot = resolve(runtimeModulesDir, mutation.oldClientName);
        const newClientRoot = resolve(runtimeModulesDir, mutation.newClientName);
        fs.renameSync(oldClientRoot, newClientRoot);
        break;
      }
      case "update-runtime-client-routes": {
        const { clientName, clientRoutes } = mutation;
        const clientRoutesFile = resolve(runtimeModulesDir, clientName, "src/routes.ts");
        const runtimeClientRoutesSource = await generateRuntimeClientRoutesSource(clientRoutes);
        fs.writeFileSync(clientRoutesFile, runtimeClientRoutesSource);
        break;
      }
      case "update-runtime-client-html": {
        const htmlSrc = resolve(modulesDir, mutation.clientName, "client/index.html");
        const htmlDest = resolve(runtimeModulesDir, mutation.clientName, "index.html");

        if (fs.existsSync(htmlSrc)) fs.copyFileSync(htmlSrc, htmlDest);
        break;
      }
      case "update-runtime-client-env": {
        const envSrc = resolve(modulesDir, mutation.clientName, "client/.env");
        const envDest = resolve(runtimeModulesDir, mutation.clientName, ".env");

        if (fs.existsSync(envSrc)) fs.copyFileSync(envSrc, envDest);
        break;
      }
      case "update-client-sdk-routes": {
        const sdkRoutesFile = resolve(clientSdkDir, "routes.ts");
        const routesSource = await generateClientSdkRoutesSource(mutation.clients);
        fs.ensureFileSync(sdkRoutesFile);
        fs.writeFileSync(sdkRoutesFile, routesSource);
        break;
      }
    }
  }
}

function generateRuntimeFileTree(args: {
  packageManagerName: string;
  packageManagerVersion: string;
}): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "firedeck-runtime",
        "version": "0.0.0",
        "private": true,
        "type": "module",
        "packageManager": "${args.packageManagerName}@${args.packageManagerVersion}",
        "workspaces": [
          "modules/*"
        ],
        "scripts": {
          "dev": "../../node_modules/.bin/turbo dev",
          "build": "../../node_modules/.bin/turbo build"
        }
      }`,
    },

    "turbo.json": {
      content: `
      {
        "$schema": "https://turbo.build/schema.json",
        "tasks": {
          "dev": {
            "persistent": true,
            "cache": false
          },
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["apps/**/dist/**", "apps/**/lib/**", "apps/**/bin/**"]
          },
          "//#emulate": {
            "persistent": true
          }
        }
      }`,
    },

    ".gitignore": {
      content: [
        ".idea",
        ".turbo",
        ".firebase",
        "node_modules",
        "dist",
        ".env",
        ".env.local",
        "*.log",
        "firebase-export-*",
      ].join("\n"),
      extension: "md",
    },
  };
}

export function generateRuntimeClientFileTree(args: { clientName: string }): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "${args.clientName}",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "../../../../node_modules/.bin/vite",
          "build": "../../../../node_modules/.bin/tsc -b && ../../../../node_modules/.bin/vite build",
          "preview": "../../../../node_modules/.bin/vite preview"
        }
      }`,
    },

    "vite.config.ts": {
      content: `
      import { defineConfig } from "vite";
      import react from "@vitejs/plugin-react";
      import tailwindcss from "@tailwindcss/vite";
      import { resolve } from "node:path";
      
      const __dirname = import.meta.dirname;
      
      // https://vite.dev/config/
      export default defineConfig({
        plugins: [react(), tailwindcss()],
        resolve: {
          alias: {
            "@": resolve(__dirname, "../../../../modules"),
          },
        }
      })`,
    },

    "tsconfig.app.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "isolatedModules": true,
          "moduleDetection": "force",
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "rootDir": "../../../../",
          "paths": {
            "@/*": ["../../../../modules/*"],
          },
          "types": ["vite/client"]
        },
        "include": ["./src", "./global.d.ts", "../../../../modules"]
      }`,
    },

    "tsconfig.node.json": {
      content: `
      {
        "compilerOptions": {
          "target": "es2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,
      
          /* Bundler mode */
          "module": "nodenext",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
      
          /* Linting */
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "erasableSyntaxOnly": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["vite.config.ts"]
      }`,
    },

    "tsconfig.json": {
      content: `
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }`,
    },

    "global.d.ts": {
      content: 'declare module "*.css";',
    },

    ".gitignore": {
      content: [
        "# Logs",
        "logs",
        "*.log",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "pnpm-debug.log*",
        "lerna-debug.log*",
        "node_modules",
        "dist",
        "dist-ssr",
        "*.local",
        "# Editor directories and files",
        ".vscode/*",
        "!.vscode/extensions.json",
        ".idea",
        ".DS_Store",
        "*.suo",
        "*.ntvs*",
        "*.njsproj",
        "*.sln",
        "*.sw?",
      ].join("\n"),
      extension: "md",
    },

    "index.html": {
      content: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${args.clientName}</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/index.tsx"></script>
        </body>
      </html>`,
    },

    "public/favicon.svg": {
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -34.34 30.47)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#k)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#l)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#m)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#n)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#o)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#p)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="b" width="60.045" height="41.654" x="-19.77" y="16.149" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-54.613" y="-7.533" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-49.64" y="2.03" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-45.045" y="20.029" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-43.513" y="21.178" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="15.756" y="-17.901" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-27.636" y="-22.853" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="20.116" y="-38.415" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="24.641" y="-11.323" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="8.244" y="-2.416" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="18.713" y="10.588" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>',
      extension: "html",
    },

    "src/index.tsx": {
      content: `
      import "./index.css";
      import { createRoot } from "react-dom/client";
      import { RouterProvider, createBrowserRouter } from "react-router";
      import customizer from "@/${args.clientName}/client/index.tsx";
      import routes from "./routes.ts";
      
      const router = createBrowserRouter(routes);
      
      createRoot(document.getElementById("root")!).render(
        customizer(<RouterProvider router={router} />)
      );`,
    },

    "src/index.css": {
      content: `
      @import "tailwindcss";
      @import "../../../../../modules/${args.clientName}/client/index.css";
      `,
    },
  };
}

async function generateRuntimeClientRoutesSource(routes: ProjectRoute) {
  function createReplaceTarget(str: string) {
    return `$$${str}$$`;
  }

  function createDynamicImportStatement(str: string) {
    return createReplaceTarget(`() => import('${str}').then((mod) => mod.default)`);
  }

  function generateReactRouterRoute(
    route: ProjectRoute,
    parentPlaceholderName?: string | null,
  ): RouterRoute {
    const elementName = route.pageName || route.layoutName || undefined;

    return {
      id: elementName,
      path: route.pageImportPath ? route.urlPath! : undefined,
      loader: route.guardImportPath ? createReplaceTarget(route.guardName!) : undefined,
      lazy: elementName
        ? {
            Component: route.pageImportPath
              ? createDynamicImportStatement(route.pageImportPath)
              : route.layoutImportPath
                ? createDynamicImportStatement(route.layoutImportPath)
                : undefined,
          }
        : undefined,
      HydrateFallback: route.placeholderImportPath
        ? createReplaceTarget(route.placeholderName!)
        : parentPlaceholderName
          ? createReplaceTarget(parentPlaceholderName)
          : undefined,
      children:
        route.children.length > 0
          ? route.children.map((child) => generateReactRouterRoute(child, route.placeholderName))
          : undefined,
    };
  }

  const routeDeclarationSource = JSON.stringify(generateReactRouterRoute(routes)).replace(
    /"?\$\$"?/gm,
    "",
  );

  const routeImportSource = flattenRoutes(routes).reduce((importSrc, route) => {
    const imports = [];

    if (route.placeholderImportPath)
      imports.push(`import ${route.placeholderName} from "${route.placeholderImportPath}";`);

    if (route.guardImportPath)
      imports.push(`import ${route.guardName} from "${route.guardImportPath}";`);

    return imports.length === 0 ? importSrc : importSrc + imports.join("\n") + "\n";
  }, "");

  const routerSource = `
      ${routeImportSource}

      export default [${routeDeclarationSource}];
    `;

  return format(routerSource, getPrettierConfig({ filePath: "a.tsx" }));
}

async function generateClientSdkRoutesSource(clients: ProjectClient[]) {
  const routerSource = clients.reduce((source, client) => {
    const routeEnumSource = flattenRoutes(client.routes).reduce((source, route) => {
      if (!route.pageName || !route.urlPath || route.urlPath === NOT_FOUND_URL_PATH) return source;

      return source + `${snakeCase(route.pageName).toUpperCase()} = "${route.urlPath}",\n`;
    }, "");

    const clientSource = `
      export enum ${startCase(client.name).replaceAll(" ", "")}Route { 
        ${routeEnumSource} 
      };\n`;

    return source + clientSource + "\n";
  }, "");

  const finalSource = `
    /**
     * ------------------------------------
     * This file was generated by Firedeck.
     *
     * Do not edit this file directly.
     * Your changes will be overwritten.
     * ------------------------------------
     */
     
     ${routerSource}
    `;

  return format(finalSource, getPrettierConfig({ filePath: "a.ts" }));
}

function flattenRoutes(route: ProjectRoute): ProjectRoute[] {
  return [
    { ...route, children: [] },
    ...route.children.reduce((flats, childRoute) => {
      return [...flats, ...flattenRoutes(childRoute)];
    }, [] as ProjectRoute[]),
  ];
}
