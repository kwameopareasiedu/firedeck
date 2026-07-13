# Firedeck

Firedeck is an opinionated CLI application for building full stack applications with Firebase, React
and Vite:

## Objectives

- Initialize project directories with boilerplate code
- Manage Firebase projects based on current application state
- Manage dynamic routing using client code directory
- Deploy project to Firebase

## Modules

Firedeck is based on the concept of **modules**, which are directories of your application component
consisting of client code, server code or both. A Firedeck application should have at least one
module.

Each module ultimately maps to:

- A React+Vite frontend app,
- A Firebase functions group in the generated Firebase backend
- A Firebase hosting site which is the deployment target of the frontend app.

As such, a module should contain either `client` or `server` directories or both. A module without
any of these is ignored by the compiler.

A module directory will have the following structure:

```
<module-name>/
  - server/
  - client/
    - pages/
    - index.html
```

### Module Client

The `client` directory contains the source that would be included in the frontend application of the
Firedeck runtime via Typescript path aliasing.

The client directory copies [Next.js' app-router](https://nextjs.org/docs/app) structure (_minus
server components and functions_) and has a structure like so:

```
<module-name>/
  - client/
    - pages/
      - (dashboard)/
        - dashboard-layout.tsx
        - dashboard-page.tsx
        - dashboard-guard.ts
        - users
          - users-page.tsx
          - users-placeholder.tsx
          - [userId]/
            - user-details-page.tsx
      - (public)/
        - landing
          - landing-page.tsx
        - contact
          - contact-page.tsx
        - login/
          - login-page.tsx
  - index.css
  - index.html
  - index.tsx
```

At runtime, Firedeck builds the router that links to pages using an approach called "directory
router spec". With this approach, firedeck examines the `client/pages` directory in a depth-first
manner searching for the following files within each directory:

| File               | Description                                                                           |
|--------------------|---------------------------------------------------------------------------------------|
| `*page.tsx`        | Defines the page component to display for the generated URL for the directory path    |
| `*layout.tsx`      | Defines the layout component to use for the generated URL tree for the directory path |
| `*placeholder.tsx` | Defines the component to display while the page component is being fetched            |
| `*guard.ts`        | Defines the function to control access to the page component                          |

Using a suffix-based convention avoids naming every page, `page.tsx` or `layout.tsx`, which would
lead to editor fatigue and affect the developer experience.

The page file would resemble the snippet below:

```typescript jsx
// Required default export. The page for the generated URL at the directory path
export default function IndexPage() {
    return (
        <div>
            <p>Home page</p>
        </div>
    );
}
```

A layout file would resemble the snippet below:

```typescript jsx
import {Outlet} from "react-router";

// Required default export. The layout used for the generated URL at the directory path and its subtree
export default function IndexLayout() {
    return (
        <div>
            <Outlet/>
        </div>
    );
}
```

A placeholder file would resemble the snippet below:

```typescript jsx
// Required default export. The component which is displayed while the page component is fetched
export default function IndexPlaceholder() {
    return <p className="text-center">Please wait</p>;
}
```

A guard file would resemble the snippet below:

```typescript jsx
// import { redirect } from "react-router";

// Required default export. The function which controls access to the page component
export default function indexGuard() {
    return true; // Allow access
    // return redirect("redirect-path"); // Redirect to another page
}
```

#### Tailwindcss Configuration

Each module client is automatically configured to use Tailwindcss 4 out of the box. Changes can be
made to the `index.css` within the module which reflects in the app immediately.

#### App Customization

Each module has an `index.tsx` at its root. This file exports a default function which is used to
customize the router component. You can use this file to wrap the router with other providers.

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

export default function (appRouter: ReactNode) {
    return (
        <QueryClientProvider client={queryClient}>
            {appRouter}
        </QueryClientProvider>
    );
}
```

## Firedeck Runtime

Firedeck compiles the "modules" directory into a final application at runtime.

At runtime, a [Turbo](https://turborepo.dev/) monorepo is created at `.firedeck/runtime` which
contains [Vite](https://vite.dev/) applications
and[Firebase cloud function apps](https://firebase.google.com/docs/functions) for all modules.

This monorepo application is completely handled by Firedeck so you don't need to worry about it.

## Client SDK

Firedeck also generates a client SDK source files based on the modules. This package provides
utilities which connect the frontend and backend module component.

The package lives at `modules/sdk/client`. Because it is part of the user code, IDE auto-complete
and intellisense work out of the box and can also be commited to version control.

> ⚠ Code in `modules/sdk/client` is maintained by the Firedeck compiler. Any user changes would be
> overwritten.

The client SDK contains the following files:

### Routes.ts

For each module client, a route enum is generated in the `routes.ts` files.

Let's assume your project has two modules; `main` and `admin`:

```
<root-dir>
  - modules/
    - main/
      - client/
        - pages/
          - index-page.tsx
          - contact/
            - contact-page.tsx
          - features/
            - features-page.tsx
    - admin/
      - client/
        - pages/
          - settings/
            - settings-page.tsx
```

You can access the routes for these modules in a component like so:

```typescript jsx
/* modules/main/client/pages/index-page.tsx */

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

Take note of the following:

> ⚡ Route enums are derived from the module name.
>
> (E.g. `main` module yields `MainRoute`, `admin` module yields `AdminRoute`)

> ⚡ Route enum members are derived from page file component names.
>
> (E.g. `export default function IndexPage() {}` yields a route enum member `INDEX_PAGE`)

> ⚡ Navigating to a route in a different module will yield a 404 (Not found) response.

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
