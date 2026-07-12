import { OutputHierarchy } from "@/types";

export function generateProjectHierarchy(opts: {
  projectName: string;
  projectDescription: string;
  projectVersion: string;
  projectAuthor: string;
}): OutputHierarchy {
  return {
    "package.json": {
      content: `
      {
        "name": "${opts.projectName}",
        "description": "${opts.projectDescription}",
        "version": "${opts.projectVersion}",
        "author": "${opts.projectAuthor}",
        "private": true,
        "type": "module",
        "scripts": {
          "dev": "firedeck run",
          "build": "firedeck build"
        },
        "devDependencies": {
          "firedeck": "^0.1.0",
          "prettier": "3.9.4",
          "react": "^19.2.7",
          "react-dom": "^19.2.7"
        }
      }`,
    },

    ".gitignore": {
      content: `
      .firedeck
      .idea
      .vscode
      node_modules
      dist
      temp
      .firebase
      .env
      .env*
      !.env.sample`,
      extension: "md",
    },

    "tsconfig.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ESNext",
          "module": "ESNext",
          "moduleResolution": "Bundler",
          "esModuleInterop": true,
          "forceConsistentCasingInFileNames": true,
          "jsx": "react-jsx",
          "strict": true,
          "noEmit": true,
          "skipLibCheck": true,
          "rootDir": ".",
          "baseUrl": ".",
          "paths": {
            "@/*": ["modules/*"]
          }
        },
        "include": ["modules"]
      }`,
    },

    ".prettierrc": {
      content: `
      {
        "tabWidth": 2,
        "useTabs": false,
        "printWidth": 100,
        "singleQuote": false,
        "jsxSingleQuote": false,
        "trailingComma": "all",
        "semi": true,
        "bracketSameLine": true,
        "arrowParens": "always"
      }`,
      extension: "json",
    },

    "firedeck.json": {
      content: `
      {}`,
    },

    // "modules/main/client/pages/index.route.tsx": {
    //   content: `
    //   import { definePage } from "firedeck";
    //
    //   export default definePage({
    //     page() {
    //       return (
    //         <div className="grid place-items-center">
    //           <p>Welcome to Firedeck</p>
    //         </div>
    //       );
    //     },
    //   });`,
    // },

    "modules/main/server/hello.ts": {
      content: `
      import { defineFunction } from "firedeck";

      export default defineFunction({
        async handler() {
          console.log("Hello Firedeck");
        },
      });`,
    },

    "modules/shared/client/components/index.tsx": {
      content: ``,
    },
  };
}

export function generateModuleHierarchy(args: {
  name: string;
  components: "all" | "client" | "server";
}): OutputHierarchy {
  const contents: OutputHierarchy = {};

  if (["all", "client"].includes(args.components)) {
    contents[`modules/${args.name}/client/pages/index.route.tsx`] = {
      content: `
      import { definePage } from "firedeck";
      
      export default definePage({
        page() {
          return (
            <div className="grid place-items-center">
              <p>Module: ${args.name} Home</p>
            </div>
          );
        },
      });`,
    };
  }

  if (["all", "server"].includes(args.components)) {
    contents[`modules/${args.name}/server/hello.ts`] = {
      content: `
      import { defineFunction } from "firedeck";
      
      export default defineFunction({
        async handler() {
          console.log("Hello Firedeck");
        },
      });`,
    };
  }

  return contents;
}

export function generateRuntimeRootHierarchy(): OutputHierarchy {
  return {
    "package.json": {
      content: `
      {
        "name": "firedeck-runtime",
        "version": "0.0.0",
        "private": true,
        "type": "module",
        "packageManager": "yarn@1.22.22",
        "workspaces": [
          "modules/*"
        ],
        "scripts": {
          "dev": "turbo dev",
          "build": "turbo build"
        },
        "dependencies": {
          "turbo": "^2.10.4",
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
      content: `
      .idea
      .turbo
      .firebase
      node_modules
      dist
      .env
      .env.local
      *.log
      firebase-export-*`,
      extension: "md",
    },
  };
}

export function generateRuntimeClientHierarchy(args: { clientName: string }): OutputHierarchy {
  return {
    "package.json": {
      content: `
      {
        "name": "${args.clientName}",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "tsc -b && vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^19.2.7",
          "react-dom": "^19.2.7"
        },
        "devDependencies": {
          "@types/node": "^24.13.2",
          "@types/react": "^19.2.17",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^6.0.3",
          "typescript": "~6.0.2",
          "typescript-eslint": "^8.62.0",
          "vite": "^8.1.1"
        }
      }`,
    },

    "vite.config.ts": {
      content: `
      import { defineConfig } from 'vite'
      import react from '@vitejs/plugin-react'
      import { resolve } from "node:path";
      
      const __dirname = import.meta.dirname;
      
      // https://vite.dev/config/
      export default defineConfig({
        plugins: [react()],
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
          "noUncheckedSideEffectImports": true,
          "baseUrl": ".",
          "rootDir": "../../../../",
          "paths": {
            "@/*": ["../../../../modules/*"],
          }
        },
        "include": ["src", "../../../../modules"]
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

    ".gitignore": {
      content: `
      # Logs
      logs
      *.log
      npm-debug.log*
      yarn-debug.log*
      yarn-error.log*
      pnpm-debug.log*
      lerna-debug.log*
      
      node_modules
      dist
      dist-ssr
      *.local
      
      # Editor directories and files
      .vscode/*
      !.vscode/extensions.json
      .idea
      .DS_Store
      *.suo
      *.ntvs*
      *.njsproj
      *.sln
      *.sw?`,
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
      import { StrictMode } from "react";
      import { createRoot } from "react-dom/client";
      import { RouterProvider } from "react-router";
      import router from "./router.tsx";
      
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <RouterProvider router={router} />
        </StrictMode>,
      );`,
    },

    "src/index.css": {
      content: `
      `,
    },
  };
}
