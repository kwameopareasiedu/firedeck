import { FiredeckProject, ProjectMutation, ProjectMutationType } from "@/types";
import { PackageManagerName } from "shared/package-manager";

/**
 * Compares two {@link FiredeckProject}s and generates list of {@link ProjectMutation}s which when
 * applied to the `source` project, will yield the `target project`
 */
export function compareProjects(source: FiredeckProject | null, target: FiredeckProject) {
  const changes: ProjectMutation[] = [];

  if (!source) {
    source = {
      config: {
        packageManager: {
          name: "none" as never as PackageManagerName,
          version: "none",
        },
        vite: { modules: {} },
        firebase: {
          project: { id: "", alias: "" },
          modules: {},
          firestore: { indexes: [], rules: "" },
          storage: { rules: "" },
        },
      },
      clients: [],
      backends: [],
    };

    changes.push({ type: "create-runtime" });
  }

  const sourceClients = new Map(source.clients.map((client) => [client.name, client]));

  // Check for new and/or modified clients
  for (const targetClient of target.clients) {
    const sourceClient = sourceClients.get(targetClient.name);

    if (!sourceClient) {
      changes.push(
        { type: "add-runtime-client", clientName: targetClient.name },
        { type: "update-runtime-client-env", clientName: targetClient.name },
        { type: "update-runtime-client-html", clientName: targetClient.name },
        { type: "update-runtime-client-public-dir", clientName: targetClient.name },
        { type: "update-runtime-client-sdk", clientName: targetClient.name },
      );
    } else {
      if (sourceClient.name !== targetClient.name) {
        changes.push({
          type: "rename-runtime-client",
          oldName: sourceClient.name,
          newName: targetClient.name,
        });
      }

      if (sourceClient.env !== targetClient.env) {
        changes.push({ type: "update-runtime-client-env", clientName: targetClient.name });
      }

      if (sourceClient.indexHtml !== targetClient.indexHtml) {
        changes.push({ type: "update-runtime-client-html", clientName: targetClient.name });
      }

      if (sourceClient.publicLastModifiedTs !== targetClient.publicLastModifiedTs) {
        changes.push({ type: "update-runtime-client-public-dir", clientName: targetClient.name });
      }

      if (JSON.stringify(sourceClient.routes) !== JSON.stringify(targetClient.routes)) {
        changes.push({ type: "update-runtime-client-sdk", clientName: targetClient.name });
      }
    }
  }

  const targetClients = new Map(target.clients.map((client) => [client.name, client]));

  // Check for deleted clients
  for (const sourceClient of source.clients) {
    const destClient = targetClients.get(sourceClient.name);

    if (!destClient) {
      changes.push({ type: "remove-runtime-client", clientName: sourceClient.name });
    }
  }

  const sourceBackends = new Map(source.backends.map((backend) => [backend.name, backend]));

  // Check for new and modified backends
  for (const destBackend of target.backends) {
    const sourceBackend = sourceBackends.get(destBackend.name);

    if (!sourceBackend) {
      changes.push(
        { type: "add-runtime-backend", backendName: destBackend.name },
        { type: "update-runtime-backend-env", backendName: destBackend.name },
        { type: "update-runtime-backend-functions", backendName: destBackend.name },
      );
    } else {
      if (sourceBackend.name !== destBackend.name) {
        changes.push({
          type: "rename-runtime-backend",
          oldName: sourceBackend.name,
          newName: destBackend.name,
        });
      }

      if (sourceBackend.env !== destBackend.env) {
        changes.push({ type: "update-runtime-backend-env", backendName: destBackend.name });
      }

      if (JSON.stringify(sourceBackend.functions) !== JSON.stringify(destBackend.functions)) {
        changes.push({ type: "update-runtime-backend-functions", backendName: destBackend.name });
      }
    }
  }

  const destBackends = new Map(target.backends.map((backend) => [backend.name, backend]));

  // Check for deleted backends
  for (const sourceBackend of source.backends) {
    const destBackend = destBackends.get(sourceBackend.name);

    if (!destBackend) {
      changes.push({ type: "remove-runtime-backend", backendName: sourceBackend.name });
    }
  }

  const updateWorkspaceEnvTypes = changes.some((change) => {
    return (
      [
        "update-runtime-client-env",
        "remove-runtime-client",
        "update-runtime-backend-env",
        "remove-runtime-backend",
      ] as ProjectMutationType[]
    ).includes(change.type);
  });

  const updateRuntime =
    JSON.stringify(source.config) !== JSON.stringify(target.config) ||
    changes.some((change) => {
      return (
        [
          "add-runtime-backend",
          "rename-runtime-backend",
          "remove-runtime-backend",
        ] as ProjectMutationType[]
      ).includes(change.type);
    });

  if (updateWorkspaceEnvTypes) changes.push({ type: "update-workspace-env-types" });
  if (updateRuntime) changes.push({ type: "update-runtime" });

  return changes;
}
