import { assertFiredeckRootDir } from "@/utils";
import { analyzeProject } from "@/analyze-project";
import { compareProjectModels } from "@/compare-project-models";
import { applyProjectMutations } from "@/apply-project-mutations";
import { ProjectModel } from "@/types";

export async function compileProject(rootDir: string, model?: ProjectModel | null) {
  assertFiredeckRootDir(rootDir);

  const updatedModel = await analyzeProject(rootDir);
  const mutations = compareProjectModels(model ?? null, updatedModel);
  await applyProjectMutations(rootDir, mutations);

  return [updatedModel, mutations] as const;
}
