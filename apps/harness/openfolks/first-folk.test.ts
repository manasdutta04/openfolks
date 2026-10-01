import { rmSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";

import { pickPebbleSeed, PEBBLE_SEEDS } from "../../../shared/pebble-avatars.ts";
import { DATA_DIR } from "../config.ts";
import type { ModelSelection } from "../contracts.ts";
import { Store } from "../store.ts";
import { createFirstFolk, FIRST_FOLK_NAME, FIRST_FOLK_TITLE } from "./first-folk.ts";

const selection = (): ModelSelection => ({ instanceId: "fake", model: "fake-model" });

describe("createFirstFolk", () => {
  beforeEach(() => {
    rmSync(DATA_DIR, { recursive: true, force: true });
  });

  it("creates a single Assistant folk with an auto-assigned bot avatar shape", () => {
    const store = new Store(selection);
    const bot = createFirstFolk(store, selection());
    expect(bot.name).toBe(FIRST_FOLK_NAME);
    expect(bot.title).toBe(FIRST_FOLK_TITLE);
    expect(bot.avatarSeed).toBeTruthy();
    expect(store.bots).toHaveLength(1);
  });
});

describe("createBot avatar variety", () => {
  beforeEach(() => {
    rmSync(DATA_DIR, { recursive: true, force: true });
  });

  it("assigns distinct colors and avatar shapes across new folks when possible", () => {
    const store = new Store(selection);
    const bots = Array.from({ length: 5 }, () => store.createBot({}, { seedMessages: false }));
    const colors = new Set(bots.map((b) => b.color));
    const seeds = new Set(bots.map((b) => b.avatarSeed));
    expect(colors.size).toBe(5);
    expect(seeds.size).toBe(5);
  });
});

describe("pickPebbleSeed", () => {
  it("prefers unused catalog shapes before minting extras", () => {
    expect(pickPebbleSeed(["clover", "flower"], 0)).not.toBe("clover");
    expect(pickPebbleSeed(["clover", "flower"], 0)).not.toBe("flower");
    expect(PEBBLE_SEEDS).toContain(pickPebbleSeed([], 0));
    const exhausted = pickPebbleSeed(PEBBLE_SEEDS, 0);
    expect(exhausted.startsWith("shape-")).toBe(true);
  });
});
