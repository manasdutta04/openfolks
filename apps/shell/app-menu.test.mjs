import { describe, expect, it, vi } from "vitest";

import { buildAppMenuTemplate, TITLE_MENU_LABELS } from "./app-menu.mjs";

describe("app menu", () => {
  it("puts Settings under the app menu on macOS", () => {
    const sendCommand = vi.fn();
    const template = buildAppMenuTemplate({ platform: "darwin", appName: "OpenFolks", sendCommand });
    expect(template[0]?.label).toBe("OpenFolks");
    const settings = template[0]?.submenu?.find((item) => item.label === "Settings…");
    expect(settings?.accelerator).toBe("CommandOrControl+,");
    settings?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("open-settings");
  });

  it("shows File / Edit / View / Go / Folks / Window / Help on Windows", () => {
    const sendCommand = vi.fn();
    const template = buildAppMenuTemplate({ platform: "win32", sendCommand });
    const labels = template.map((item) => item.label ?? item.role);
    expect(labels).toEqual(["File", "Edit", "View", "Go", "Folks", "Window", "Help"]);
    expect(TITLE_MENU_LABELS).toEqual(["File", "Edit", "View", "Go", "Folks", "Window", "Help"]);

    const file = template[0];
    const newFolk = file?.submenu?.find((item) => item.label === "New Folk");
    expect(newFolk?.accelerator).toBe("CommandOrControl+N");
    newFolk?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("new-folk");

    const settings = file?.submenu?.find((item) => item.label === "Settings…");
    expect(settings).toBeTruthy();

    const go = template.find((item) => item.label === "Go");
    const search = go?.submenu?.find((item) => item.label === "Search…");
    search?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("open-search");

    const desk = go?.submenu?.find((item) => item.label === "Desk");
    desk?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("open-desk");

    const marketplace = go?.submenu?.find((item) => item.label === "Marketplace…");
    marketplace?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("open-marketplace");

    const folks = template.find((item) => item.label === "Folks");
    const browse = folks?.submenu?.find((item) => item.label === "Browse Folks in Marketplace…");
    browse?.click?.();
    expect(sendCommand).toHaveBeenCalledWith("open-marketplace-folks");
  });
});
