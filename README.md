# Firedeck

Firedeck is an **opinionated**, batteries-included application **compiler** for Firebase-backed
React SPAs.

Firedeck allows you to write modules which are your application logic, and it compiles them into a
working runtime that can be built and deployed to Firebase.

[//]: # (@formatter:off)
> ⚡ **Important Note**
>
> - _Firedeck **is not** a runtime or a framework_
>
> - _Instead, it **is a** compiler that utilizes well-established technologies you already know and
    love to give you a complete Firebase development environment._
>
> - _These are:_
>   - [Turbo](https://turborepo.dev) handles runtime monorepo orchestration
>   - [Vite](https://vite.dev)+[React](https://react.dev) handles frontend application bundling
>   - [React Router](https://reactrouter.com) handles frontend routing
>   - [Firebase](https://firebase.google.com) handles API and trigger functions
[//]: # (@formatter:on)

## Features

- Skeleton project boilerplate
- Managed **Turbo** runtime consisting of Vite and Firebase applications
- Directory based routing, implemented with **React Router**
- Automatic generation of client SDK to access firebase apps from the frontends
- Simple environment variables setup
- One config file to rule them all

[//]: # (> ⚡ **Important Note**)

[//]: # (>)

[//]: # (> _Firedeck depends on `firebase-tools`, so make sure you have it installed globally_)

## Project Structure

A Firedeck application has the following structure:

```
- firedeck/
- modules/
  - backend/
  - client/
  - sdk/
    - client/
  - shared/
- .gitignore
- .pretierrc
- eslint.config.js
- firedeck.config.ts
- package.json
- tsconfig.json
```

| Path                 | Description                               |
|----------------------|-------------------------------------------|
| `firedeck`           | Firedeck workspace directory              |
| `modules/backend`    | Backend [modules](#Modules) directory     |
| `modules/client`     | Client [modules](#Modules) directory      |
| `modules/sdk/client` | Directory for auto-generated client SDK   |
| `modules/shared`     | Directory for shared code between modules |
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

| Module Type | Description                                                                                               |
|-------------|-----------------------------------------------------------------------------------------------------------|
| Client      | Frontend related code which compiles to a React+Vite application and deploys to Firebase hosting          |
| Backend     | Backend related code which compiles to a Firebase functions application and deploys to Firebase functions |

> ⚡ **Important Note**
>
> - _You can create a new client module by running `firedeck module --client <module-name>`_.
>
>
> - _You can create a new backend module by running `firedeck module --backend <module-name>`_.
>
>
> - _Even though client and backend modules live in different directories, each module name should
    be unique since they end up in one directory after compilation_.

### Client Modules

As mentioned already, client modules represent a frontend component within your application and are
compiled to fully configured React+Vite applications.

Client modules live under `modules/client` and have the following directory structure:

```
<module-name>/  
  - pages/        #(Contains component files which make up the compiled React+Vite application)
  - public/       #(Contains files to be copied to the public directory of the compiled React+Vite application)
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
    - (dashboard)/                        Route Group (Not part of URL)
      - dashboard-layout.tsx
      - dashboard-page.tsx                URL: "/"
      - dashboard-before.ts
      - users
        - users-page.tsx                  URL: "/users"
        - users-placeholder.tsx
        - [userId]/
          - user-details-page.tsx         URL: "/users/:userId"
    - (public)/                           Route Group (Not part of URL)
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

At compile-time, Firedeck builds the client module router. With this approach, firedeck examines the
`<module-name>/pages` directory in a depth-first manner searching for the following file name
patterns within each directory:

| File Name Suffix Pattern | Description                                                                | Required In Directory |
|--------------------------|----------------------------------------------------------------------------|-----------------------|
| `*page.tsx`              | The page component to display for the URL of the directory                 | No                    |
| `*layout.tsx`            | The layout component to use for the URL tree of the directory path         | No                    |
| `*placeholder.tsx`       | The component to display while the page component is being fetched         | No                    |
| `*before.ts`             | The the function to evaluate **before** rendering the route page component | No                    |

[//]: # (@formatter:off)
> ⚡ **Important Note**
>
> - _Client module routing is heavily inspired
    by [Next.js' App Router](https://nextjs.org/docs/app). I highly recommend going through its
    documentation for more in-depth information._
>
>
> - _The generated client module router is a [data mode](https://reactrouter.com/start/data/routing)
    **React Router** instance._
>
>
> - _Firedeck uses a **suffix-based** file name convention, which avoids the annoying `page.tsx` or
    `layout.tsx` file duplication. This allows you can give descriptive names to your page files (
    E.g. `user.page.tsx`, `settings-page.tsx`), enabling easy navigation in your editor_.
>
>
> - _You can also co-locate other component files in the same directory without issue_.
>
>
> - _If defined, `*page.tsx`, `*layout.tsx` and `*placeholder.tsx` files must **default export** a
    single plain React component. E.g_:
>
>   ```typescript jsx
>   export default function ComponentName() {
>     return <div>Hello World</div>;
>   }
>   ```
>
>
> - _If defined, `*before.ts` must **default export** a single (async) function which can fetch data
    before the page is rendered or even redirect to another page if a condition is not met_.
>
>   ```typescript jsx
>   // import { redirect } from "react-router";
> 
>   export default function () {
>     return true; // Allow access
>     // return redirect("redirect-path"); // Redirect to another page
>   }
>   ```
[//]: # (@formatter:on)

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

#### Public Directory Support

Each client module has a `public` directory. Changes made to this directory are reflected to the
`public` directory of the compiled React+Vite application.

### Backend Modules

Backend modules represent a backend component within your application and are compiled to standalone
Firebase function applications.

Backend modules live under `modules/backend` and have the following directory structure:

```
<module-name>/  
  - functions/        #(Contains function files which make up the compiled Firebase functions application)
```

#### Backend Module Function

[Firebase cloud functions](https://firebase.google.com/docs/functions) allows you to write backend
functions that are triggered in response to HTTPS requests, background events or cron schedules.

Your backend module function files must **default export** a functions-compatible handler.

As an example, the handler below is called in response to an HTTPS call from the frontend firebase
SDK and returns `"Hello"` string as a response.

```typescript
import {onCall} from "firebase-functions/v2/https"; // HTTPS request handler
// import { onDocumentUpdatedWithAuthContext } from "firebase-functions/v2/firestore"; // Firestore document update handler
// import { onObjectFinalized } from "firebase-functions/v2/storage"; // Storage object uploaded handler

export default onCall(async function (req) {
    return "Hello";
});
```

[//]: # (@formatter:off)
> ⚡ **Important Note**
>
> - _Since a default export is used in the backend module function file, the generated name is based
    on the filename. E.g. a file named `get-user-data.ts` would yield a name of `getUserData`_
>
>
> - _All functions in a backend module are compiled to one firebase execution unit_.
> 
>     - _As an example, if your backend module contains 5 functions, the compiled function will 
>       contain all 5 functions, even though only one is called by Firebase to handle an event._
>   
>     - _This means if one of your functions imports a very heavy dependency, it will affect the 
>       cold start times of every other function in that module._
>   
>     - _So it's always a good idea to separate functions with heavy dependencies into their own 
>       backend modules to avoid this issue._
> 
> - _All functions in a backend module are compiled to one firebase execution unit_.

[//]: # (@formatter:on)

## Environment Variables

Firedeck projects have a central `.env` file at the root, which contain env variables for all
modules of the application.

Each variable in the `.env` file must be prefixed with the module name and a double underscore
separator (I.e. `<MODULE_NAME>__`). This allows Firedeck to create individual `.env` files for each
module at compile time.

As an example, let's assume you have two modules:

- `modules/client/main` (Client module)
- `modules/backend/api` (Backend module)

For env variables in each module, the resulting root `.env` file will look like this:

```dotenv
# "main" client module env variables. The "VITE_" prefix is required for Vite applications
MAIN__VITE_API_URL=https://api.example.com
MAIN__VITE_THEME=dardk

# "api" backend module env variables
API__DB_URL=psql://user:pass@localhost:5432/db
API__SERVICE_KEY=oiroinvowijref0928f2398
```

> ⚡ **Important Note**
>
> - _Since client modules get transformed into a Vite application, you need to prefix client modules
    env variables with `VITE_`. This results in a full prefix of `<MODULE_NAME>__VITE_`._
>
>
> - _After `firedeck compile`, `firedeck run` or `firedeck buid` is invoked, typings are generated
    for the env file. This way your IDE can provide intellisense for `import.meta.env` with the
    exact variables in your `.env`, improving your developer experience a little bit more._

## Firedeck Runtime

When `firedeck compile`, `firedeck run` or `firedeck buid` is invoked, Firedeck compiles the
"modules" directory into a full runtime.

The runtime is a [Turbo](https://turborepo.dev/) monorepo which lives at `firedeck/runtime` and
contains [Vite](https://vite.dev/) applications for each client module, and a single
[Firebase cloud functions apps](https://firebase.google.com/docs/functions) for each backend module.

> ⚡ **Important Note**
>
> - _The runtime application is managed by the Firedeck compiler. Any manual changes will be
    overwritten._

## Client SDK

Firedeck also generates a client SDK source files based on the modules. This package provides
utilities which connect the frontend and backend module component.

The client SDK lives at `modules/sdk/client`. Because it is part of the user code, IDE auto-complete
and intellisense work out of the box and can also be commited to version control if you so wish.

> ⚡ **Important Note**
>
> - _The client SDK is managed by the Firedeck compiler. Any manual changes will be overwritten._

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

[//]: # (@formatter:off)
> ⚡ **Important Note**
>
> - _Route enums are derived from the module name, so `main` module would yield `enum MainRoute {}`,
    likewise, `admin` module would yield `enum AdminRoute {}`_
>
>
> - _Route enum members are derived from page file names. Thus, the folder structure above would yield
    the route enums:_
>
>   ```typescript
>   export enum MainRoute {
>     INDEX_PAGE = "/",
>     ABOUT_PAGE = "/about",
>   }
>   
>   export enum AdminRoute {
>     INDEX_PAGE = "/",
>     SETTINGS_PAGE = "/settings",
>   }
>   ```
>
>
> - _Navigating to a route in a different module will display a 404 (Not found) page._

[//]: # (@formatter:on)

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
});
```

### Vite Config

The `vite` field is a promise returning function which is passed the module name, vite mode and an
env object file and should return a [Vite `UserConfig` object](https://vite.dev/config/).

### Firebase Config

The `firebase` field defines the configuration which resolves to the following Firebase
configuration files:

- `.firebaserc`
- `firebase.json`
- `firestore.indexes.json`
- `firestore.rules`
- `storage.rules`

Below is the firedeck config interface, showcasing all the firebase configuration options:

```typescript
import {UserConfig} from "vite";

interface FiredeckConfig {
    vite: (args: {
        module: string,
        mode: "development" | "production",
        env: Record<string, string>
    }) => Promise<UserConfig>;

    firebase: {
        projects: {
            [firebaseProjectAlias: string]: { // Alias is a name you define to represent this firebase project 
                id: "<firebase-project-id>";
                targets: {
                    hosting:
                        | "auto" // Indicates that Firedeck should setup the hosting targets automatically
                        | { [identifier: string]: string[] }; // Each identifier should map to a list of hosting sites configured in the Firebase console
                };
            };
        };

        firestore: {
            indexes: { // Indexes should be setup from error messages in GCP
                collectionGroup: string;
                queryScope: "COLLECTION" | "COLLECTION_GROUP";
                fields: {
                    fieldPath: string;
                    order?: "ASCENDING" | "DESCENDING";
                }[];
            }[];

            rules: string;
        };

        storage: {
            rules: string
        };
    }
};
```
