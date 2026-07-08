export type FSContents = { [path: string]: { content: string; extension?: string } };

export const generateProjectContents = (opts: {
  name: string;
  description: string;
  version: string;
  author: string;
}): FSContents => {
  return {
    "package.json": {
      content: `
      {
        "name": "${opts.name}",
        "description": "${opts.description}",
        "version": "${opts.version}",
        "author": "${opts.author}",
        "private": true,
        "type": "module",
        "scripts": {
          "dev": "firedeck run",
          "build": "firedeck build"
        },
        "devDependencies": {
          "firedeck": "^0.1.0",
          "prettier": "3.9.4"
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

    "modules/main/client/pages/index.route.tsx": {
      content: `
      import { definePage } from "firedeck";
      
      export default definePage({
        page() {
          return (
            <div className="grid place-items-center">
              <p>Welcome to Firedeck</p>
            </div>
          );
        },
      });`,
    },

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
};

export const generateModuleContents = (args: {
  name: string;
  components: "all" | "client" | "server";
}): FSContents => {
  const contents: FSContents = {};

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
};
