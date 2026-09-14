import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Store } from "../store.ts";
import { importOpenFolksCrew, prepareProjectFolder } from "./import-crew.ts";
import { loadOpenFolksPackageDocument } from "./load-package.ts";

describe("openfolks import", () => {
  it("scaffolds project folder and imports five folks via standard createBot path", () => {
    const dataDir = mkdtempSync(join(tmpdir(), "openfolks-test-"));
    process.env.OPENFOLKS_DATA_DIR = dataDir;
    const project = mkdtempSync(join(tmpdir(), "openfolks-project-"));
    try {
      prepareProjectFolder(project);
      expect(existsSync(join(project, "job_search_tracker.csv"))).toBe(true);
      expect(existsSync(join(project, "profile", "04-job-evaluation.md"))).toBe(true);
      expect(existsSync(join(project, "portals", "freehire-search", "cli", "src", "cli.ts"))).toBe(true);

      const store = new Store(() => ({ instanceId: "claude", model: "claude-sonnet-4-20250514" }));
      const result = importOpenFolksCrew(store, project, { instanceId: "claude", model: "claude-sonnet-4-20250514" });
      expect(result.botIds).toHaveLength(5);
      expect(result.groupIds).toHaveLength(1);
      expect(store.bots).toHaveLength(5);
      expect(store.groups).toHaveLength(1);
      expect(store.groups[0]?.memberIds).toHaveLength(5);
      for (const bot of store.bots) {
        expect(bot.cwd).toBe(project);
        expect(bot.section).toBe("Job Search");
        expect(bot.composio).toBe(false);
      }
      const names = store.bots.map((b) => b.name).sort();
      expect(names).toEqual(["Coach", "Generalist", "Scout", "Tailor", "Tracker"]);
    } finally {
      delete process.env.OPENFOLKS_DATA_DIR;
      rmSync(dataDir, { recursive: true, force: true });
      rmSync(project, { recursive: true, force: true });
    }
  });

  it("package document validates without folk-specific server branches", () => {
    const doc = loadOpenFolksPackageDocument();
    expect(doc.package.agents.every((a) => a.playbooks?.length)).toBe(true);
  });
});
