# Firedeck

Firedeck is an **opinionated**, batteries-included application **compiler** for Firebase-backed
React SPAs.

Firedeck allows you to write modules which are your application logic, and it compiles them into a
working runtime that can be built and deployed to Firebase.

## Features

- Skeleton project boilerplate
- Managed [Turbo](https://turborepo.dev) runtime consisting of Vite and Firebase applications
- Directory based routing, similar to [Next.js app router](https://nextjs.org/docs/app), implemented
  with [React Router](https://reactrouter.com)
- Automatic generation of client SDK to access firebase apps from the frontends
- Simple environment variables setup
- One config file to rule them all

> ⚡ **Important Note**
>
> Firedeck depends on `firebase-tools`, so make sure you have it installed globally

## Project Structure

A Firedeck application has the following structure:

```
- modules/
  - client/
  - server/
- .gitignore
- .pretierrc
- eslint.config.js
- firedeck.config.ts
- package.json
- tsconfig.json
```

| Path                 | Description                               |
|----------------------|-------------------------------------------|
| `modules/client`     | Client [modules](#Modules) directory      |
| `modules/server`     | Server [modules](#Modules) directory      |
| `.gitignore`         | Ignore file list for Git                  |
| `.prettierrc`        | Configuration file for Prettier formatter |
| `eslint.config.js`   | Configuration file for ESlint linter      |
| `firedeck.config.ts` | Configuration file for Firedeck compiler  |
| `package.json`       | Configuration file for package managers   |
| `tsconfig.json`      | Configuration file for Typescript         |

## Modules

Firedeck is based on the concept of **modules**, which are simply directories representing different
parts of your application structure.

Firedeck offers different module types described in the table below:

| Module Type | Description                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------------|
| Client      | Frontend related code which compiles to a React+Vite application and deploys to Firebase hosting      |
| Server      | API related code which compiles to a Firebase functions application and deploys to Firebase functions |

### Client Modules

As mentioned already, client modules represent a frontend component within your application and are
compiled to fully configured React+Vite applications.

Client modules live under `modules/client` and have the following directory structure:

```
<module-name>/  
  - pages/        #(Contains component files which make up the compiled React+Vite application)
  - .env          #(The env file for the compiled React+Vite application. Env variables must be prefixed with 'VITE_')
  - index.html    #(The entry point into the React+Vite application)
  - index.css     #(The stylesheet of the React+Vite, configured to use Tailwind 4)
  - root.tsx      #(The root builder of the React+Vite application. More on this below)
```

#### Directory Based Routing

Client modules use directory based routing, where the URL paths are generated based on the
`<module-name>/pages/` directory structure.

This is illustrated in the following client module directory:

```
<module-name>/
  - pages/
    - (dashboard)/
      - dashboard-layout.tsx
      - dashboard-page.tsx                URL: "/"
      - dashboard-before.ts
      - users
        - users-page.tsx                  URL: "/users"
        - users-placeholder.tsx
        - [userId]/
          - user-details-page.tsx         URL: "/users/:userId"
    - (public)/
      - landing
        - landing-page.tsx                URL: "/landing"
      - contact
        - contact-page.tsx                URL: "/contact"
      - login/
        - login-page.tsx                  URL: "/login"
  - index.css
  - index.html
  - root.tsx
```

> ⚡ **Important Note**
>
> Client module routing is heavily inspired by [Next.js' App Router](https://nextjs.org/docs/app).
> I highly recommend going through its documentation for more in-depth information.

At compile-time, Firedeck builds the client module router. With this approach, firedeck examines the
`<module-name>/pages` directory in a depth-first manner searching for the following file name
patterns within each directory:

| File Name **Suffix** Pattern | Description                                                                | Required In Directory |
|------------------------------|----------------------------------------------------------------------------|-----------------------|
| `*page.tsx`                  | The page component to display for the URL of the directory                 | No                    |
| `*layout.tsx`                | The layout component to use for the URL tree of the directory path         | No                    |
| `*placeholder.tsx`           | The component to display while the page component is being fetched         | No                    |
| `*before.ts`                 | The the function to evaluate **before** rendering the route page component | No                    |

##### Points To Note

- The client module router is a [React Router](https://reactrouter.com/)
  in [data mode](https://reactrouter.com/start/data/routing).


- Firedeck uses a suffix-based file name convention, which avoids the annoying `page.tsx` or
  `layout.tsx` duplication.


- You can give descriptive names to your page file (E.g. `user.page.tsx`, `settings-page.tsx`)
  allowing you to easily navigate through them in your editor.


- You can also co-locate other component files in the same directory without issue.


- If defined, `*page.tsx`, `*layout.tsx` and `*placeholder.tsx` files must **default export** a
  single plain React component. E.g:

  ```typescript jsx
  export default function MyAwesomePage() {
    return <div>Hello World</div>;
  }
  ```

- If defined, `*before.ts` must **default export** a single (async) function which can fetch data
  before the page is rendered or even redirect to another page if a condition is not met.

  ```typescript jsx
  // import { redirect } from "react-router";

  export default function () {
    return true; // Allow access
    // return redirect("redirect-path"); // Redirect to another page
  }
  ```

#### Tailwindcss Configuration

Client modules are configured to use [Tailwind 4](https://www.tailwindcss.com/) right out of the
box.

Simply add Tailwind class names in component files or put reusable class names in the `index.css`
file.

#### Root Builder

Each client module has a `root.tsx` file which exports a default function which is used to build
the root of the resulting React app. You can use this file to wrap the router with other providers.

In the example below, we wrap our router with Tanstack Query provider:

```typescript jsx
import type {ReactNode} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
        },
    },
});

export default function RootBuilder(appRouter: ReactNode) {
    return (
        <QueryClientProvider client={queryClient}>
            {appRouter}
        </QueryClientProvider>
    );
}
```

## Environment Variables

Firedeck projects have a central `.env` file at the root, which contain env variables for all
modules of the application.

Each variable in the `.env` file must be prefixed with the module name and a double underscore
separator (I.e. `<MODULE_NAME>__`). This allows Firedeck to create individual `.env` files for each
module at compile time.

As an example, let's assume you have two modules:

- `modules/client/main` (Client module)
- `modules/server/api` (Server module)

For env variables in each module, the resulting root `.env` file will look like this:

```dotenv
# "main" client module env variables. The "VITE_" prefix is required for Vite applications
MAIN__VITE_API_URL=https://api.example.com
MAIN__VITE_THEME=dardk

# "api" server module env variables
API__DB_URL=psql://user:pass@localhost:5432/db
API__SERVICE_KEY=oiroinvowijref0928f2398
```

> ⚡ **Important Note**
>
> _Since client modules get transformed into a Vite application, you need to prefix client modules
env variables with `VITE_`. This results in a full prefix of `<MODULE_NAME>__VITE_`._

> ⚡ **Important Note**
>
> After `firedeck compile` is run, typings are generated for the env file. This way your IDE can
> provide intellisense for `import.meta.env` with the exact variables in your `.env`, improving your
> developer experience a little bit more.

## Firedeck Runtime

When `firedeck compile`, `firedeck run` or `firedeck buid` is invoked, Firedeck compiles the
"modules" directory into a full runtime.

The runtime is a [Turbo](https://turborepo.dev/) monorepo which lives at `.firedeck/runtime` and
contains [Vite](https://vite.dev/) applications for each client module, and a single
[Firebase cloud functions app](https://firebase.google.com/docs/functions) for all server modules.

This monorepo application is completely handled by Firedeck so you don't need to worry about it.

## Client SDK

Firedeck also generates a client SDK source files based on the modules. This package provides
utilities which connect the frontend and backend module component.

The package lives at `modules/sdk/client`. Because it is part of the user code, IDE auto-complete
and intellisense work out of the box and can also be commited to version control if you so wish.

> ⚡ **Important Note**
>
> _Code in `modules/sdk/client` is maintained by the Firedeck compiler. Any user changes would be
> overwritten._

The client SDK contains the following files:

### Routes.ts

For each module client, a route enum is generated in the `routes.ts` files.

Let's assume your project has two modules; `main` and `admin`:

```
<root-dir>
  - modules/
    - client/
      - main/
        - pages/
          - index-page.tsx
          - contact/
            - contact-page.tsx
          - features/
            - features-page.tsx
      - admin/
        - pages/
          - settings/
            - settings-page.tsx
```

You can access the routes for these modules in a component like so:

```typescript jsx
/* modules/client/main/pages/index-page.tsx */

import {Link, useNavigate} from "react-router";
import {AdminRoute, MainRoute} from "@/sdk/client/routes";

export function IndexPage() {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(MainRoute.ABOUT_PAGE);
    }

    return (
        <div>
            <Link to={MainRoute.CONTACT_PAGE}>Go to contacts</Link>
            <button onClick={handleNavigate}>Go to features page</button>

            {/* Will navigate to a 404 */}
            <Link to={AdminRoute.SETTINGS_PAGE}>Go to admin settings</Link>
        </div>
    );
}
```

> ⚡ **Important Note**
>
> _Route enums are derived from the module name, so `main` module would yield `enum MainRoute {}`,
> likewise, `admin` module would yield `enum AdminRoute {}`_

> ⚡ **Important Note**
>
> _Route enum members are derived from page file names, so a folder structure like so_:
> ```
> <root-dir>/
>   - modules/
>     - client/
>       - main/
>         - pages/
>           - index-page.tsx
>           - about/
>             - about-page.tsx
>       - admin/
>         - pages/
>           - index-page.tsx
>           - settings/
>             - settings-page.tsx
> ```
> _would yield the route enum:_
> ```typescript
> export enum MainRoute {
>   INDEX_PAGE = "/",
>   ABOUT_PAGE = "/about",
> }
> 
> export enum AdminRoute {
>   INDEX_PAGE = "/",
>   SETTINGS_PAGE = "/settings",
> }
> ```

> ⚡ **Important Note**
>
> Navigating to a route in a different module will display a 404 (Not found) page.

## Firedeck.config.ts

Since Firedeck generates the resulting Vite and Firebase projects at runtime, manual changes made to
the generated artifacts will be overwritten.

Configuration of the runtime artifacts is done via the provided `firedeck.config.ts`, which has the
following structure:

```typescript
import {defineConfig} from "firedeck";

export default defineConfig({
    vite: async ({module, mode, env}) => {
        return {}
    },
    firebase: {}
})
```

### Vite Config

The `vite` field is a promise returning function which is passed the module name, vite server mode
and an env object file.

The function should return a promise resolving to a [Vite
`UserConfig` object](https://vite.dev/config/).

### Firebase Config

[//]: # (TODO)

[//]: # (The server functions defined by the module will be available to the client via the `useApi` hook.)

[//]: # (This hook is)

[//]: # (regenerated in the generated bridge whenever the server files are modified. _For reference, this is)

[//]: # (similar to how)

[//]: # ([tRPC]&#40;https://trpc.io/&#41; works_.)

[//]: # ()

[//]: # (When deployed, the client would be hosted on firebase hosting while the server is deployed to)

[//]: # (firebase functions.)

[//]: # ()

[//]: # (The `config.json` allows module customization. It's properties are defined below:)

[//]: # ()

[//]: # (| Property | Description | Default Value | Required |)

[//]: # (|----------|-------------|---------------|----------|)

[//]: # (|          |             |               |          |)

[//]: # ()

[//]: # (## Runtime)

[//]: # ()

[//]: # (During development, Firedeck emits a Turbo monorepo project to `.firedeck/runtime`. This monorepo is)

[//]: # (built from the)

[//]: # (analysis of the `modules` directory which contains the user code.)

[//]: # ()

[//]: # (Each module in the `modules` directory maps to the following:)

[//]: # ()

[//]: # (- A standalone Vite application which serves the `client` component)

[//]: # (- A standalone functions directory which hosts the `server` component, configured in the)

[//]: # (  `.firebaserc` and)

[//]: # (  `firebase.json` config files.)

[//]: # ()

[//]: # (When the `dev` command is run, the user code is statically analyzed to create necessary data)

[//]: # (structures &#40;JSON)

[//]: # (serializable&#41; to create the above-mentioned applications.)

[//]: # ()

[//]: # (After this two process run concurrently to watch the user code for any changes and regenerate the)

[//]: # (application files)

[//]: # (where necessary and also to run the generated applications.)

[//]: # ()

[//]: # (The flow is summed up in the diagram below:)

[//]: # ()

[//]: # (```)

[//]: # (                     Run dev)

[//]: # (                        ↓)

[//]: # (                  Static analyis)

[//]: # (                        ↓)

[//]: # (              Generate monorepo files)

[//]: # (                        ↓)

[//]: # (               ―――――――――――――――――――)

[//]: # (              ↓                   ↓)

[//]: # (       Watch user modules    Run monorepo)

[//]: # (        for changes and      application)

[//]: # (        update monorepo  )

[//]: # (             files)

[//]: # (```)

[//]: # ()

[//]: # (## CLI)

[//]: # ()

[//]: # (| Command              | Description                                                         |)

[//]: # (|----------------------|---------------------------------------------------------------------|)

[//]: # (| `init`               | Initializes the project folder structure and copies templates files |)

[//]: # (| `module create NAME` | Creates a new module                                                |)

