import { describe, expect, it } from "vitest";

import { isLlmEngine, splitEngineRail } from "./engine-rail";

describe("splitEngineRail", () => {
  it("keeps Cloud engines above Local engines", () => {
    const { subscription, custom } = splitEngineRail([
      { access: "subscription", instanceId: "claude" },
      { access: "custom", instanceId: "hermes" },
      { instanceId: "grok" },
      { access: "custom", instanceId: "pi" },
    ]);
    expect(subscription.map((row) => row.instanceId)).toEqual(["claude", "grok"]);
    expect(custom.map((row) => row.instanceId)).toEqual(["hermes", "pi"]);
  });

  it("keeps Computer off the LLM rail", () => {
    expect(isLlmEngine({ driverKind: "claudeAgent" })).toBe(true);
    expect(isLlmEngine({ driverKind: "boxAgent" })).toBe(false);
  });

  it("hides the second group when nothing is custom-only", () => {
    const rows = [{ instanceId: "claude" }];
    expect(splitEngineRail(rows).custom).toEqual([]);
  });
});
