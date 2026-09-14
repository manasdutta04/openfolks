/**
 * Keep custom inset chrome only where the platform owns a stable inset model.
 * Windows uses a titleBarOverlay so brand + File/Edit menus can sit on one
 * row with the caption buttons; the renderer must reserve that strip.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { skinChrome } = require("./skin-overlay.cjs");

export const WIN_TITLEBAR_HEIGHT = 36;

/**
 * @param {NodeJS.Platform} platform
 * @param {string} [skin]
 */
export function windowChromeOptions(platform, skin = "graphite") {
  if (platform === "darwin") {
    return { titleBarStyle: "hiddenInset", trafficLightPosition: { x: 16, y: 16 } };
  }
  if (platform === "win32") {
    const chrome = skinChrome(skin);
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: chrome.color,
        symbolColor: chrome.symbolColor,
        height: WIN_TITLEBAR_HEIGHT,
      },
    };
  }
  return {};
}
