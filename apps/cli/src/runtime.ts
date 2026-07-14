export interface ClientRoute {
  pageName: string | null;
  pageImportPath: string | null;
  layoutName: string | null;
  layoutImportPath: string | null;
  placeholderName: string | null;
  placeholderImportPath: string | null;
  guardName: string | null;
  guardImportPath: string | null;
  urlPath: string | null;
  children: ClientRoute[];
}

export interface ReactRouterRoute {
  id?: string;
  path?: string | null;
  element?: string | null;
  loader?: string | null;
  children?: ReactRouterRoute[];
}

export interface RuntimeClient {
  name: string;
  routes: ClientRoute;
  htmlHash: number;
  envHash: number;
}

export type RuntimeChange =
  | { type: "create-runtime" }
  | { type: "add-runtime-client"; clientName: string }
  | { type: "remove-runtime-client"; clientName: string }
  | { type: "rename-runtime-client"; oldClientName: string; newClientName: string }
  | { type: "update-runtime-client-routes"; clientName: string; clientRoutes: ClientRoute }
  | { type: "update-runtime-client-html"; clientName: string }
  | { type: "update-runtime-client-env"; clientName: string }
  | { type: "update-client-sdk-routes"; clients: RuntimeClient[] };

export class Runtime {
  readonly clients: RuntimeClient[];

  constructor(args: { clients: RuntimeClient[] }) {
    this.clients = args.clients;
  }

  diffFrom(source: Runtime | null) {
    const changes: RuntimeChange[] = [];

    if (!source) {
      changes.push({ type: "create-runtime" });
      source = new Runtime({ clients: [] });
    }

    const sourceClients = new Map(source.clients.map((client) => [client.name, client]));

    for (const destClient of this.clients) {
      const sourceClient = sourceClients.get(destClient.name);

      if (!sourceClient) {
        changes.push(
          {
            type: "add-runtime-client",
            clientName: destClient.name,
          },
          {
            type: "update-runtime-client-routes",
            clientName: destClient.name,
            clientRoutes: destClient.routes,
          },
          {
            type: "update-runtime-client-html",
            clientName: destClient.name,
          },
          {
            type: "update-runtime-client-env",
            clientName: destClient.name,
          },
        );
      } else {
        if (sourceClient.name !== destClient.name) {
          changes.push({
            type: "rename-runtime-client",
            oldClientName: sourceClient.name,
            newClientName: destClient.name,
          });
        }

        if (JSON.stringify(sourceClient.routes) !== JSON.stringify(destClient.routes)) {
          changes.push({
            type: "update-runtime-client-routes",
            clientName: destClient.name,
            clientRoutes: destClient.routes,
          });
        }

        if (sourceClient.htmlHash !== destClient.htmlHash) {
          changes.push({
            type: "update-runtime-client-html",
            clientName: destClient.name,
          });
        }

        if (sourceClient.envHash !== destClient.envHash) {
          changes.push({
            type: "update-runtime-client-env",
            clientName: destClient.name,
          });
        }
      }
    }

    const destClients = new Map(this.clients.map((client) => [client.name, client]));

    for (const sourceClient of source.clients) {
      const destClient = destClients.get(sourceClient.name);

      if (!destClient) {
        changes.push({
          type: "remove-runtime-client",
          clientName: sourceClient.name,
        });
      }
    }

    if (changes.some((change) => change.type.includes("client"))) {
      changes.push({
        type: "update-client-sdk-routes",
        clients: Object.values(this.clients),
      });
    }

    return changes;
  }
}
