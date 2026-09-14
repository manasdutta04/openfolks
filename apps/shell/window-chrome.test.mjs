import { describe, expect, it } from "vitest";

import { WIN_TITLEBAR_HEIGHT, windowChromeOptions } from "./window-chrome.mjs";

describe("window chrome", () => {
  it("uses inset traffic lights on macOS", () => {
    expect(windowChromeOptions("darwin")).toEqual({
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 16, y: 16 },
    });
  });

  it("uses a title-bar overlay on Windows so menus share the caption row", () => {
    expect(windowChromeOptions("win32")).toEqual({
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#0b0b0e",
        symbolColor: "#a8a8b3",
        height: WIN_TITLEBAR_HEIGHT,
      },
    });
  });

  it("keeps Linux window chrome native", () => {
    expect(windowChromeOptions("linux")).toEqual({});
  });
});
