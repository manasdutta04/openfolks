/**
 * Native application menu — Mac-style File / Edit / View / Go / Folks /
 * Window / Help. On Windows the native bar is hidden; the renderer title
 * strip opens these submenus beside the app name via `popupApplicationSubmenu`.
 */
import { app, BrowserWindow, Menu, shell } from "electron";

export const MENU_COMMAND_CHANNEL = "menu:command";

/** Labels shown in the Windows title strip (left → right). */
export const TITLE_MENU_LABELS = ["File", "Edit", "View", "Go", "Folks", "Window", "Help"];

/** @typedef {"new-folk" | "open-settings" | "open-desk" | "open-marketplace" | "open-marketplace-folks" | "open-skill-recorder" | "open-search"} MenuCommand */

/**
 * @param {{
 *   platform?: NodeJS.Platform,
 *   appName?: string,
 *   sendCommand?: (command: MenuCommand) => void,
 * }} [options]
 */
export function buildAppMenuTemplate(options = {}) {
  const platform = options.platform ?? process.platform;
  const isMac = platform === "darwin";
  const appName = options.appName ?? (typeof app !== "undefined" && app?.name ? app.name : "OpenFolks");
  /** @param {MenuCommand} command */
  const send = (command) => {
    options.sendCommand?.(command);
  };

  return [
    ...(isMac
      ? [
          {
            label: appName,
            submenu: [
              { role: "about" },
              { type: "separator" },
              {
                label: "Settings…",
                accelerator: "CommandOrControl+,",
                click: () => send("open-settings"),
              },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Folk",
          accelerator: "CommandOrControl+N",
          click: () => send("new-folk"),
        },
        { type: "separator" },
        ...(!isMac
          ? [
              {
                label: "Settings…",
                accelerator: "CommandOrControl+,",
                click: () => send("open-settings"),
              },
              { type: "separator" },
            ]
          : []),
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac ? [{ role: "pasteAndMatchStyle" }, { role: "delete" }, { role: "selectAll" }] : [
          { role: "delete" },
          { type: "separator" },
          { role: "selectAll" },
        ]),
        { type: "separator" },
        {
          label: "Search…",
          click: () => send("open-search"),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Desk",
          accelerator: "CommandOrControl+1",
          click: () => send("open-desk"),
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Go",
      submenu: [
        {
          label: "Search…",
          click: () => send("open-search"),
        },
        {
          label: "Desk",
          accelerator: "CommandOrControl+D",
          click: () => send("open-desk"),
        },
        {
          label: "Marketplace…",
          accelerator: "CommandOrControl+Shift+M",
          click: () => send("open-marketplace"),
        },
        {
          label: "Browse Folks…",
          click: () => send("open-marketplace-folks"),
        },
        { type: "separator" },
        {
          label: "Create Skills",
          click: () => send("open-skill-recorder"),
        },
        { type: "separator" },
        {
          label: "Settings…",
          click: () => send("open-settings"),
        },
      ],
    },
    {
      label: "Folks",
      submenu: [
        {
          label: "New Folk",
          accelerator: "CommandOrControl+N",
          click: () => send("new-folk"),
        },
        { type: "separator" },
        {
          label: "Open Desk",
          click: () => send("open-desk"),
        },
        {
          label: "Browse Folks in Marketplace…",
          click: () => send("open-marketplace-folks"),
        },
      ],
    },
    { role: "windowMenu", label: "Window" },
    {
      role: "help",
      label: "Help",
      submenu: [
        {
          label: "OpenFolks on GitHub",
          click: () => {
            void shell.openExternal("https://github.com/manasdutta04/openfolks");
          },
        },
        {
          label: "Report an Issue…",
          click: () => {
            void shell.openExternal("https://github.com/manasdutta04/openfolks/issues/new/choose");
          },
        },
        { type: "separator" },
        {
          label: "Marketplace…",
          click: () => send("open-marketplace"),
        },
      ],
    },
  ];
}

/** Send a menu command to the focused OpenFolks window (or the first one). */
export function sendMenuCommand(command, getWindows = () => BrowserWindow.getAllWindows()) {
  const focused = BrowserWindow.getFocusedWindow();
  const win = focused && !focused.isDestroyed() ? focused : getWindows().find((w) => !w.isDestroyed());
  if (!win) return false;
  win.webContents.send(MENU_COMMAND_CHANNEL, command);
  return true;
}

/**
 * Open a top-level application submenu under the custom Windows title strip.
 * @param {string} label
 * @param {{ x: number, y: number, browserWindow: import("electron").BrowserWindow }} where
 */
export function popupApplicationSubmenu(label, where) {
  const menu = Menu.getApplicationMenu();
  if (!menu || !where?.browserWindow || where.browserWindow.isDestroyed()) return false;
  const needle = String(label ?? "").toLowerCase();
  const item = menu.items.find((entry) => {
    const entryLabel = entry.label?.toLowerCase() ?? "";
    const entryRole = entry.role?.toLowerCase() ?? "";
    if (entryLabel === needle) return true;
    if (entryRole === needle) return true;
    // Electron top-level roles are `editMenu` / `windowMenu`; the title strip
    // is the human label ("Edit"/"Window"). Prefer partial matching.
    if (entryRole && entryRole.includes(needle)) return true;
    if (entryLabel && entryLabel.includes(needle)) return true;
    return false;
  });
  if (!item?.submenu) return false;
  item.submenu.popup({
    window: where.browserWindow,
    x: Math.round(where.x),
    y: Math.round(where.y),
  });
  return true;
}

/** Install the app-wide menu. Safe to call once after `app.whenReady()`. */
export function installAppMenu(options = {}) {
  const platform = options.platform ?? process.platform;
  const menu = Menu.buildFromTemplate(
    buildAppMenuTemplate({
      ...options,
      sendCommand: (command) => sendMenuCommand(command),
    }),
  );
  Menu.setApplicationMenu(menu);
  // Windows draws File/Edit in the custom title strip; hide the extra native row.
  if (platform === "win32") {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.setMenuBarVisibility(false);
    }
  }
  return menu;
}
