import { assertFiredeckRootDir, info } from "@/utils";
import { analyzeProject } from "@/analyze-project";
import { compareProjectModels } from "@/compare-project-models";
import { applyProjectMutations } from "@/apply-project-mutations";
import { CompileProjectOptions, ProjectModel } from "@/types";

/** Compiles a Firedeck project */
export async function compileProject(
  rootDir: string,
  model?: ProjectModel | null,
  opts?: CompileProjectOptions,
) {
  assertFiredeckRootDir(rootDir);

  const updatedModel = await analyzeProject(rootDir);
  const mutations = compareProjectModels(model ?? null, updatedModel);

  if (opts?.explain) {
    info(`Pending Mutations (${mutations.length})`);

    for (let i = 0; i < mutations.length; i++) {
      const spacing = "\n".repeat(i === mutations.length - 1 ? 1 : 0);
      info(`${(i + 1).toString().padStart(2, " ")}. ${mutations[i].type} ${spacing}`);
    }
  }

  await applyProjectMutations(rootDir, mutations, {
    firebaseProjectAlias: opts?.firebaseProjectAlias,
  });

  return [updatedModel, mutations] as const;
}
