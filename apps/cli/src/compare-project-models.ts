import { ProjectModel, ProjectMutation } from "@/types";
import { PackageManagerName } from "shared/package-manager";

/**
 * Compares two `ProjectModel` objects and generates list of `ProjectMutation` items to
 * convert the first into the second
 */
export function compareProjectModels(source: ProjectModel | null, target: ProjectModel) {
  const changes: ProjectMutation[] = [];

  if (!source) {
    changes.push({ type: "create-runtime", config: target.config });

    source = {
      config: {
        packageManager: {
          name: "none" as never as PackageManagerName,
          version: "none",
        },
      },
      clients: [],
      backends: [],
    };
  }

  const sourceClients = new Map(source.clients.map((client) => [client.name, client]));

  // Check for new and modified clients
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
          html: destClient.indexHtml,
        },
        {
          type: "update-runtime-client-env",
          clientName: destClient.name,
          env: destClient.env,
        },
        {
          type: "update-runtime-client-public-dir",
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

      if (sourceClient.indexHtml !== destClient.indexHtml) {
        changes.push({
          type: "update-runtime-client-html",
          clientName: destClient.name,
          html: destClient.indexHtml,
        });
      }

      if (sourceClient.env !== destClient.env) {
        changes.push({
          type: "update-runtime-client-env",
          clientName: destClient.name,
          env: destClient.env,
        });
      }

      if (sourceClient.publicLastModifiedTs !== destClient.publicLastModifiedTs) {
        changes.push({
          type: "update-runtime-client-public-dir",
          clientName: destClient.name,
        });
      }
    }
  }

  const destClients = new Map(target.clients.map((client) => [client.name, client]));

  // Check for deleted clients
  for (const sourceClient of source.clients) {
    const destClient = destClients.get(sourceClient.name);

    if (!destClient) {
      changes.push({
        type: "remove-runtime-client",
        clientName: sourceClient.name,
      });
    }
  }

  const sourceBackends = new Map(source.backends.map((backend) => [backend.name, backend]));

  // Check for new and modified backends
  for (const destBackend of target.backends) {
    const sourceBackend = sourceBackends.get(destBackend.name);

    if (!sourceBackend) {
      changes.push(
        {
          type: "add-runtime-backend",
          backendName: destBackend.name,
        },
        {
          type: "update-runtime-backend-functions",
          backendName: destBackend.name,
          backendFunctions: destBackend.functions,
        },
        {
          type: "update-runtime-backend-env",
          backendName: destBackend.name,
          env: destBackend.env,
        },
      );
    } else {
      if (sourceBackend.name !== destBackend.name) {
        changes.push({
          type: "rename-runtime-backend",
          oldBackendName: sourceBackend.name,
          newBackendName: destBackend.name,
        });
      }

      if (JSON.stringify(sourceBackend.functions) !== JSON.stringify(destBackend.functions)) {
        changes.push({
          type: "update-runtime-backend-functions",
          backendName: destBackend.name,
          backendFunctions: destBackend.functions,
        });
      }

      if (sourceBackend.env !== destBackend.env) {
        changes.push({
          type: "update-runtime-backend-env",
          backendName: destBackend.name,
          env: destBackend.env,
        });
      }
    }
  }

  const destBackends = new Map(target.backends.map((backend) => [backend.name, backend]));

  // Check for deleted backends
  for (const sourceBackend of source.backends) {
    const destBackend = destBackends.get(sourceBackend.name);

    if (!destBackend) {
      changes.push({
        type: "remove-runtime-backend",
        backendName: sourceBackend.name,
      });
    }
  }

  const updateWorkspaceEnvTypes = changes.some((change) => {
    return (
      ["update-runtime-client-env", "update-runtime-backend-env"] as ProjectMutation["type"][]
    ).includes(change.type);
  });

  const updateRuntimeFiredeckConfig =
    JSON.stringify(source.config, jsonReplacer) !== JSON.stringify(target.config, jsonReplacer);

  const updateRuntimeFirebaseConfig =
    updateRuntimeFiredeckConfig ||
    changes.some((change) => {
      return (
        [
          "add-runtime-client",
          "rename-runtime-client",
          "remove-runtime-client",
          "add-runtime-backend",
          "rename-runtime-backend",
          "remove-runtime-backend",
        ] as ProjectMutation["type"][]
      ).includes(change.type);
    });

  const updateClientSdkRoutes = changes.some((change) => {
    return (
      [
        "add-runtime-client",
        "update-runtime-client-routes",
        "rename-runtime-client",
        "remove-runtime-client",
      ] as ProjectMutation["type"][]
    ).includes(change.type);
  });

  const updateClientSdkApi = changes.some((change) => {
    return (
      [
        "add-runtime-backend",
        "update-runtime-backend-functions",
        "rename-runtime-backend",
        "remove-runtime-backend",
        "add-runtime-client",
        "rename-runtime-client",
        "remove-runtime-client",
      ] as ProjectMutation["type"][]
    ).includes(change.type);
  });

  if (updateWorkspaceEnvTypes) {
    changes.push({
      type: "update-workspace-env-types",
      clients: target.clients,
    });
  }

  if (updateRuntimeFiredeckConfig) {
    changes.push({
      type: "update-runtime-clients-config",
      config: target.config,
      clients: target.clients,
    });
  }

  if (updateRuntimeFirebaseConfig) {
    changes.push({
      type: "update-runtime-firebase-config",
      config: target.config,
      clients: target.clients,
      backends: target.backends,
    });
  }

  if (updateClientSdkRoutes) {
    changes.push({
      type: "update-client-sdk-routes",
      clients: target.clients,
    });
  }

  if (updateClientSdkApi) {
    changes.push({
      type: "update-client-sdk-api",
      config: target.config,
      clients: target.clients,
      backends: target.backends,
    });
  }

  return changes;
}

function jsonReplacer(_: string, value: unknown) {
  return typeof value === "function" ? value.toString() : value;
}
