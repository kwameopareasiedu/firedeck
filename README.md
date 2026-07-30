# Firedeck

![](https://firedeck.opare.dev/firedeck-logo.png)

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
>   - [Turbo](https://turborepo.dev) for runtime monorepo orchestration
>   - [Vite](https://vite.dev)+[React](https://react.dev) for frontend application bundling
>   - [React Router](https://reactrouter.com) for frontend routing
>   - [Firebase](https://firebase.google.com) for API and trigger functions

[//]: # (@formatter:on)

## Features

- Skeleton project boilerplate
- Managed **Turbo** runtime consisting of Vite and Firebase applications
- Directory based routing, implemented with **React Router**
- Automatic generation of client SDK to access firebase apps from the frontends
- Simple environment variables setup
- One config file to rule them all

[_**Read the docs to learn more**_](https://firedeck.opare.dev).
