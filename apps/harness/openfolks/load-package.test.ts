import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { parseBotPackage } from "../bot-package.ts";
import {
  buildOpenFolksPackageSource,
  JOB_SEARCH_PACKAGE_PATH,
  loadOpenFolksPackageDocument,
} from "./load-package.ts";
import { normalizePlaybookPaths } from "./paths.ts";

describe("openfolks package", () => {
  it("builds a valid five-agent crew package from source", () => {
    const doc = buildOpenFolksPackageSource();
    expect(doc.package.id).toBe("job-search");
    expect(doc.package.agents).toHaveLength(5);
    expect(doc.package.agents.map((a) => a.key)).toEqual([
      "scout",
      "tailor",
      "tracker",
      "coach",
      "generalist",
    ]);
    expect(doc.package.playbooks!.length).toBeGreaterThanOrEqual(7);
    expect(doc.package.chiefOfStaff).toBe("generalist");
    expect(doc.package.rooms).toHaveLength(1);
    expect(doc.package.rooms![0]?.members).toEqual([
      "scout",
      "tailor",
      "tracker",
      "coach",
      "generalist",
    ]);
    expect(doc.package.rooms![0]?.defaultResponder).toEqual({ kind: "agent", agent: "generalist" });
  });

  it("round-trips packages/crews/job-search/catalog.md like other BotMRR teams", () => {
    const markdown = readFileSync(JOB_SEARCH_PACKAGE_PATH, "utf8");
    const parsed = parseBotPackage(markdown);
    expect(parsed.package.id).toBe("job-search");
    expect(parsed.package.agents).toHaveLength(5);
    expect(parsed.package.rooms).toHaveLength(1);
    expect(loadOpenFolksPackageDocument().package.agents.map((a) => a.name)).toEqual(
      parsed.package.agents.map((a) => a.name),
    );
  });

  it("rewrites legacy skill paths for project folder layout", () => {
    const out = normalizePlaybookPaths("Read `.claude/skills/job-application-assistant/04-job-evaluation.md` and run `.agents/skills/freehire-search/cli`");
    expect(out).toContain("profile/04-job-evaluation.md");
    expect(out).toContain("portals/freehire-search/cli");
  });
});
