export interface ClientRoute {
  name: string;
  pageImportPath: string | null;
  layoutImportPath: string | null;
  placeholderImportPath: string | null;
  guardImportPath: string | null;
  urlPath: string | null;
  children: ClientRoute[];
}

export interface ReactRouterRoute {
  id: string;
  path?: string | null;
  element?: string | null;
  loader?: string | null;
  children?: ReactRouterRoute[];
}

export interface RuntimeClient {
  name: string;
  routes: ClientRoute;
  htmlHash: number;
}

export type RuntimeChange =
  | { type: "create-runtime" }
  | { type: "add-client"; clientName: string }
  | { type: "remove-client"; clientName: string }
  | { type: "rename-client"; oldClientName: string; newClientName: string }
  | { type: "update-client-routes"; clientName: string; clientRoutes: ClientRoute }
  | { type: "update-client-html"; clientName: string };

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

    for (let cIdx = 0; cIdx < Math.max(source.clients.length, this.clients.length); cIdx++) {
      const sourceClient = source.clients[cIdx];
      const destClient = this.clients[cIdx];

      if (!sourceClient && destClient) {
        changes.push(
          { type: "add-client", clientName: destClient.name },
          {
            type: "update-client-routes",
            clientName: destClient.name,
            clientRoutes: destClient.routes,
          },
          { type: "update-client-html", clientName: destClient.name },
        );
      } else if (sourceClient && !destClient) {
        changes.push({ type: "remove-client", clientName: sourceClient.name });
      } else if (sourceClient && destClient) {
        if (sourceClient.name !== destClient.name) {
          changes.push({
            type: "rename-client",
            oldClientName: sourceClient.name,
            newClientName: destClient.name,
          });
        }

        if (JSON.stringify(sourceClient.routes) !== JSON.stringify(destClient.routes)) {
          changes.push({
            type: "update-client-routes",
            clientName: destClient.name,
            clientRoutes: destClient.routes,
          });
        }

        if (sourceClient.htmlHash !== destClient.htmlHash) {
          changes.push({ type: "update-client-html", clientName: destClient.name });
        }
      }
    }

    return changes;
  }
}
