# Firedeck

Firedeck is an opinionated platform for building full stack applications with Firebase, React and Vite:

# Objectives

- Initialize project directories with boilerplate code
- Manage Firebase projects based on current application state
- Manage dynamic routing using client code directory
- Deploy project to Firebase

# Modules

Firedeck is based on the concept of **modules**, which are directories of your application component consisting of
client code, server code or both.

A module also maps to a web app, hosting site and functions group with the Firebase project. As such, a module must
contain either or both client and server directories.

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

The `config.json` allows module customization. It's properties are defined below:

| Property | Description | Default Value | Required |
|----------|-------------|---------------|----------|
|          |             |               |          |
