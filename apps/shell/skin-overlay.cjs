// The native window chrome that CSS cannot reach, per skin. Everything the
// renderer paints follows `[data-skin]` in apps/desk/styles.css; the Windows
// caption-button overlay and the window's own background are drawn by the
// main process and have to be told the same colours. The values mirror each
// skin's `--color-app` (the header strip is `bg-app`) and, for the symbols,
// its `--color-ink-secondary` — flattened to opaque hex because the overlay
// accepts no alpha. Keep in step with apps/desk/styles.css and apps/desk/lib/skins.ts.
"use strict";

const SKIN_CHROME = Object.freeze({
  graphite: Object.freeze({ color: "#0b0b0e", symbolColor: "#a8a8b3" }),
  midnight: Object.freeze({ color: "#070707", symbolColor: "#b5b5b5" }),
  ember: Object.freeze({ color: "#0c0a0a", symbolColor: "#b8a8a4" }),
  tide: Object.freeze({ color: "#070c0c", symbolColor: "#9bb0ae" }),
});

const DEFAULT_SKIN = "graphite";

/** The chrome colours for a skin id sent by the renderer. Anything that is
 * not a known skin — a renamed skin, a stale value, a non-string — falls
 * back to Graphite rather than throwing, because the renderer has already
 * painted and a wrong overlay is recoverable while a broken IPC is not. */
function skinChrome(skin) {
  return Object.hasOwn(SKIN_CHROME, skin) ? SKIN_CHROME[skin] : SKIN_CHROME[DEFAULT_SKIN];
}

/** True when the id names a skin this module knows. A non-string coerces to a
 * property key that cannot match a skin id, so it answers false without a
 * separate type guard. */
function isKnownSkin(skin) {
  return Object.hasOwn(SKIN_CHROME, skin);
}

module.exports = { SKIN_CHROME, DEFAULT_SKIN, skinChrome, isKnownSkin };
