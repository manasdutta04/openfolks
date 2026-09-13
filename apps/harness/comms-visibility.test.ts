import { rmSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DATA_DIR } from "./config.ts";
import type { ModelSelection } from "./contracts.ts";
import { getOrCreateChannel } from "./comms-visibility.ts";
import { closeMessageDb } from "./message-db.ts";
import { Store } from "./store.ts";

const selection = (): ModelSelection => ({ instanceId: "claude", model: "fake-model" });

describe("folk-to-folk channel context", () => {
  beforeEach(() => {
    closeMessageDb();
    rmSync(DATA_DIR, { recursive: true, force: true });
  });

  afterEach(() => {
    closeMessageDb();
    rmSync(DATA_DIR, { recursive: true, force: true });
  });

  it("keeps a new DM in the sender's semantic section", () => {
    const store = new Store(selection);
    const from = store.createBot({ name: "Forge", section: "Agents" });
    const target = store.createBot({ name: "Quarry", section: "Agents" });

    const channel = getOrCreateChannel(store, from, target);

    expect(channel.dm).toBe(true);
    expect(channel.section).toBe("Agents");
  });

  it("updates an existing DM's context without turning Folk Chats into a stored section", () => {
    const store = new Store(selection);
    const from = store.createBot({ name: "Forge", section: "Agents" });
    const target = store.createBot({ name: "Quarry", section: "Agents" });
    const existing = store.createGroup("Forge ⇄ Quarry", [from.id, target.id], true, "Personal");

    const channel = getOrCreateChannel(store, from, target);

    expect(channel.id).toBe(existing.id);
    expect(channel.section).toBe("Agents");
    expect(channel.section).not.toBe("Folk Chats");
  });
});
