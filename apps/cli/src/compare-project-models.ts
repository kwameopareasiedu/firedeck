import { ProjectModel, ProjectMutation } from "@/types";
import { PackageManagerName } from "shared/package-manager";

export function compareProjectModels(source: ProjectModel | null, target: ProjectModel) {
  const changes: ProjectMutation[] = [];

  if (!source) {
    changes.push({ type: "create-runtime" });

    source = {
      config: {
        packageManager: {
          name: PackageManagerName.YARN,
          version: "1.22.22",
        },
      },
      clients: [],
    };
  }

  if (JSON.stringify(source.config) !== JSON.stringify(target.config))
    changes.push({ type: "update-config", config: target.config });

  const sourceClients = new Map(source.clients.map((client) => [client.name, client]));

  for (const destClient of target.clients) {
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

  const destClients = new Map(target.clients.map((client) => [client.name, client]));

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
      clients: Object.values(target.clients),
    });
  }

  return changes;
}
