import { assertFiredeckRootDir } from "@/utils";
import { analyzeProject } from "@/analyze-project";
import { compareProjectModels } from "@/compare-project-models";
import { applyProjectMutations } from "@/apply-project-mutations";
import { ProjectModel } from "@/types";

/** Compiles a Firedeck project */
export async function compileProject(
  rootDir: string,
  model?: ProjectModel | null,
  explain?: boolean,
) {
  assertFiredeckRootDir(rootDir);

  const updatedModel = await analyzeProject(rootDir);
  const mutations = compareProjectModels(model ?? null, updatedModel);
  await applyProjectMutations(rootDir, mutations, explain);

  return [updatedModel, mutations] as const;
}
