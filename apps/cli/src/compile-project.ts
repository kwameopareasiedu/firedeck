import { assertFiredeckRootDir, info } from "@/utils";
import { analyzeProject } from "@/analyze-project";
import { compareProjects } from "@/compare-projects";
import { applyProjectMutations } from "@/apply-project-mutations";
import { CompileProjectOptions, FiredeckProject } from "@/types";

/** Compiles a Firedeck project */
export async function compileProject(
  rootDir: string,
  project?: FiredeckProject | null,
  opts?: CompileProjectOptions,
) {
  assertFiredeckRootDir(rootDir);

  const updatedProject = await analyzeProject(rootDir, {
    firebaseProjectAlias: opts?.firebaseProjectAlias,
  });

  const mutations = compareProjects(project ?? null, updatedProject);

  if (opts?.explain) {
    info(`Pending Mutations (${mutations.length})`);

    for (let i = 0; i < mutations.length; i++) {
      const spacing = "\n".repeat(i === mutations.length - 1 ? 1 : 0);
      info(`${(i + 1).toString().padStart(2, " ")}. ${mutations[i].type} ${spacing}`);
    }
  }

  await applyProjectMutations(rootDir, updatedProject, mutations, {
    firebaseProjectAlias: opts?.firebaseProjectAlias,
  });

  return [updatedProject, mutations] as const;
}
