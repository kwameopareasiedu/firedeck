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
  - config.json (Optional)
  - server/
    - <function #1>.ts
    - <function #2>.ts
  - client/
    - path/
    - index.tsx
```

The server functions defined by the module will be available to the client via the `useApi` hook. This hook is
regenerated in the generated bridge whenever the server files are modified. _For reference, this is similar to how
[tRPC](https://trpc.io/) works_.

When deployed, the client would be hosted on firebase hosting while the server is deployed to firebase functions.

The `config.json` allows module customization. It's properties are defined below:

| Property | Description | Default Value | Required |
|----------|-------------|---------------|----------|
|          |             |               |          |

## CLI

| Command           | Description                                                         |
|-------------------|---------------------------------------------------------------------|
| `init`            | Initializes the project folder structure and copies templates files |
| `module new NAME` | Creates a new module                                                |
