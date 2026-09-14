import type { Store } from "../store.ts";
import { importBotPackage } from "../team-import-package.ts";
import { loadOpenFolksPackageDocument } from "./load-package.ts";
import { scaffoldProjectFolder } from "./paths.ts";

export interface ImportCrewResult {
  botIds: string[];
  groupIds: string[];
  section?: string;
}

/** Import the OpenFolks crew using the same mechanism as POST /api/teams/import — no bot-name special casing. */
export function importOpenFolksCrew(
  store: Store,
  projectFolder: string,
  selection: { instanceId: string; model: string },
): ImportCrewResult {
  const parsed = loadOpenFolksPackageDocument();
  const result = importBotPackage({
    store,
    pkg: parsed.package,
    selection,
    sectionOverride: "Job Search",
    cwd: projectFolder,
  });
  return {
    botIds: result.botIds,
    groupIds: result.groupIds,
    section: result.section,
  };
}

export function prepareProjectFolder(projectFolder: string) {
  scaffoldProjectFolder(projectFolder);
}
