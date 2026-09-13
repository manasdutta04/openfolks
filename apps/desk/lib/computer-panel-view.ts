import { readMigratedStorage, writeStorage } from "./storage-key.js";

export type ComputerPanelView = "computer" | "browser";

const STORAGE_PREFIX = "openfolks-computer-panel-view";
const STORAGE_PREFIX_LEGACY = "omb-computer-panel-view";

function storageKey(botId: string): string {
  return `${STORAGE_PREFIX}:${botId}`;
}

function legacyStorageKey(botId: string): string {
  return `${STORAGE_PREFIX_LEGACY}:${botId}`;
}

export function readComputerPanelView(
  botId: string,
  storage: Pick<Storage, "getItem"> = localStorage,
): ComputerPanelView {
  try {
    const key = storageKey(botId);
    const value =
      storage === localStorage
        ? readMigratedStorage(key, legacyStorageKey(botId))
        : storage.getItem(key);
    if (value === "browser") return value;
  } catch {
    // Storage can be unavailable in hardened or private renderer sessions.
  }
  return "computer";
}

export function writeComputerPanelView(
  botId: string,
  view: ComputerPanelView,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    if (storage === localStorage) {
      writeStorage(storageKey(botId), view);
      return;
    }
    storage.setItem(storageKey(botId), view);
  } catch {
    // The in-memory React state still preserves the choice for this mount.
  }
}
