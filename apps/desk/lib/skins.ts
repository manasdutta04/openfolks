// Skins are pure CSS. Every one of them is a block of custom properties in
// styles.css, selected by a `data-skin` attribute; this module only decides
// which one is active and remembers the choice. Nothing here knows a colour —
// that keeps the two halves from drifting apart, and it means adding a skin is
// one CSS block plus one line in SKINS.

import { readMigratedStorage, writeStorage } from "./storage-key.js";

export const SKIN_IDS = ["graphite", "midnight", "ember", "tide"] as const;
export type SkinId = (typeof SKIN_IDS)[number];

export type Skin = {
  id: SkinId;
  name: string;
  /** One line, shown under the name in the picker. */
  tagline: string;
};

export const SKINS: readonly Skin[] = [
  { id: "graphite", name: "Graphite", tagline: "Neutral slate with a muted violet edge." },
  { id: "midnight", name: "Midnight", tagline: "Cool near-black with a clear blue accent." },
  { id: "ember", name: "Ember", tagline: "Charcoal ground, coral heat." },
  { id: "tide", name: "Tide", tagline: "Deep ink with quiet seafoam." },
];

export const DEFAULT_SKIN: SkinId = "graphite";

/** Retired skins — map leftovers to Graphite. */
const RETIRED_SKINS = new Set(["atelier", "lagoon", "foundry"]);

const KEY = "openfolks-skin";
const KEY_LEGACY = "omb-skin";

// The input is whatever localStorage handed back — a string this app wrote
// on an earlier run, a value edited by hand, or a leftover from a renamed
// skin. The list is the schema.
function isSkinId(value: unknown): value is SkinId {
  // SAFETY: the assertion only satisfies includes()' parameter type; the
  // check itself is what decides, and a non-member returns false.
  return SKIN_IDS.includes(value as SkinId);
}

export function readSkin(): SkinId {
  const stored = readMigratedStorage(KEY, KEY_LEGACY);
  if (isSkinId(stored)) return stored;
  if (typeof stored === "string" && RETIRED_SKINS.has(stored)) return DEFAULT_SKIN;
  return DEFAULT_SKIN;
}

/**
 * Point the document at a skin and remember it. Called once before the first
 * paint (main.tsx) and again on every change from the picker — a stamped
 * attribute rather than a class so it can never collide with Tailwind.
 */
export function applySkin(id: SkinId): void {
  document.documentElement.dataset.skin = id;
  writeStorage(KEY, id);
  // The one surface CSS cannot reach: on Windows the caption buttons sit in a
  // native overlay the main process paints. Best-effort: a browser tab or an
  // older desktop build has no bridge, and the skin still applies without it.
  try {
    void window.ogb?.applySkin?.(id)?.catch(() => undefined);
  } catch {
    /* no bridge */
  }
}
