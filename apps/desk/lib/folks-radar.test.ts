import { describe, expect, it } from "vitest";

import { buildFolksRadarEdges, buildFolksRadarSections, folksRadarStatus, type FolksRadarSnapshot } from "./folks-radar";

const bots = [
  { id: "chief", name: "Atlas", section: "Work", chiefOfStaff: true, busy: true },
  { id: "maker", name: "Pixel", section: "Work" },
  { id: "home", name: "Mochi" },
  { id: "archived", name: "Old", hidden: true },
];

describe("folks radar projection", () => {
  it("groups visible folks by section and separates chiefs", () => {
    expect(buildFolksRadarSections(bots)).toEqual([
      { key: "Work", name: "Work", chiefs: [bots[0]], members: [bots[1]] },
      { key: "", name: "General", chiefs: [], members: [bots[2]] },
    ]);
  });

  it("keeps the unsectioned team distinct from a section literally named General", () => {
    const projected = buildFolksRadarSections([
      { id: "none", name: "Unsectioned" },
      { id: "named", name: "Named", section: " General " },
    ]);
    expect(projected.map(({ key, name }) => ({ key, name }))).toEqual([
      { key: "", name: "General" },
      { key: "General", name: "General" },
    ]);
  });

  it("keeps one edge per pair and gives live work priority", () => {
    const snapshot: FolksRadarSnapshot = {
      collaborations: [{ groupId: "channel", botIds: ["chief", "maker"], lastAt: 10 }],
      queued: [{ sourceBotId: "chief", targetBotId: "maker", reason: "design" }],
      running: [{ sourceBotId: "chief", targetBotId: "maker", threadId: "task" }],
    };
    expect(buildFolksRadarEdges(bots, snapshot)).toEqual([
      { sourceBotId: "chief", targetBotId: "maker", state: "running", groupId: undefined },
    ]);
  });

  it("filters archived endpoints and explains live states", () => {
    const snapshot: FolksRadarSnapshot = {
      collaborations: [{ groupId: "old", botIds: ["chief", "archived"], lastAt: 10 }],
      queued: [],
      running: [],
    };
    expect(buildFolksRadarEdges(bots, snapshot)).toEqual([]);
    expect(folksRadarStatus(bots[0])).toEqual({ label: "Working", tone: "success" });
    expect(folksRadarStatus({ id: "x", name: "X", activity: "waiting-on-you" })).toEqual({
      label: "Waiting for you",
      tone: "warning",
    });
  });
});
