import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Store } from "./store.ts";
import { importBotPackage } from "./team-import-package.ts";
import { loadOpenFolksPackageDocument } from "./openfolks/load-package.ts";

describe("importBotPackage", () => {
  it("creates folks, a shared room, and chief of staff from a package", () => {
    const dataDir = mkdtempSync(join(tmpdir(), "import-pkg-"));
    process.env.OPENFOLKS_DATA_DIR = dataDir;
    const project = mkdtempSync(join(tmpdir(), "import-pkg-project-"));
    try {
      const store = new Store(() => ({ instanceId: "claude", model: "claude-sonnet-4-20250514" }));
      const parsed = loadOpenFolksPackageDocument();
      const result = importBotPackage({
        store,
        pkg: parsed.package,
        selection: { instanceId: "claude", model: "claude-sonnet-4-20250514" },
        sectionOverride: "Job Search",
        cwd: project,
      });
      expect(result.botIds).toHaveLength(5);
      expect(result.groupIds).toHaveLength(1);
      expect(store.groups[0]?.memberIds).toHaveLength(5);
      expect(store.bots.find((bot) => bot.chiefOfStaff)?.name).toBe("Generalist");
    } finally {
      delete process.env.OPENFOLKS_DATA_DIR;
      rmSync(dataDir, { recursive: true, force: true });
      rmSync(project, { recursive: true, force: true });
    }
  });
});
