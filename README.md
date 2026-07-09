# Firedeck

Firedeck is an opinionated CLI application for building full stack applications with Firebase, React and Vite:

## Objectives

- Initialize project directories with boilerplate code
- Manage Firebase projects based on current application state
- Manage dynamic routing using client code directory
- Deploy project to Firebase

## Modules

Firedeck is based on the concept of **modules**, which are directories of your application component consisting of
client code, server code or both.

A module maps to a web app, hosting site and functions group within the Firebase project(s). As such, a module must
contain either one of or both client and server directories.

A module directory will have the following structure:

```
<module-name>/
  - server/
    - hello.ts
  - client/
    - pages/
      - index.route.tsx
    - index.html
```

The server functions defined by the module will be available to the client via the `useApi` hook. This hook is
regenerated in the generated bridge whenever the server files are modified. _For reference, this is similar to how
[tRPC](https://trpc.io/) works_.

When deployed, the client would be hosted on firebase hosting while the server is deployed to firebase functions.

The `config.json` allows module customization. It's properties are defined below:

| Property | Description | Default Value | Required |
|----------|-------------|---------------|----------|
|          |             |               |          |

## Runtime

During development, Firedeck emits a Turbo monorepo project to `.firedeck/runtime`. This monorepo is built from the
analysis of the `modules` directory which contains the user code.

Each module in the `modules` directory maps to the following:

- A standalone Vite application which serves the `client` component
- A standalone functions directory which hosts the `server` component, configured in the `.firebaserc` and
  `firebase.json` config files.

When the `dev` command is run, the user code is statically analyzed to create necessary data structures (JSON
serializable) to create the above-mentioned applications.

After this two process run concurrently to watch the user code for any changes and regenerate the application files
where necessary and also to run the generated applications.

The flow is summed up in the diagram below:

```
                     Run dev
                        ↓
                  Static analyis
                        ↓
              Generate monorepo files
                        ↓
               ―――――――――――――――――――
              ↓                   ↓
       Watch user modules    Run monorepo
        for changes and      application
        update monorepo  
             files
```

## CLI

| Command              | Description                                                         |
|----------------------|---------------------------------------------------------------------|
| `init`               | Initializes the project folder structure and copies templates files |
| `module create NAME` | Creates a new module                                                |
