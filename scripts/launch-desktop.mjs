// Unpackaged `electron .` is still electron.exe, so Windows shows the atom
// icon and caches it by path. Copy Electron's dist into a private runtime
// folder, rename it OpenFolks.exe, stamp it with build/icon.ico, and launch
// that copy. OPENFOLKS_DEV_DESKTOP keeps Vite/harness working even though
// Electron then reports isPackaged (the binary is no longer named electron.exe).
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MARK = join(ROOT, "public", "openfolk.png");
const APP_ICON_PNG = join(ROOT, "apps", "shell", "resources", "app-icon.png");
const APP_ICON_ICO = join(ROOT, "build", "icon.ico");
const RUNTIME_DIR = join(ROOT, "node_modules", ".cache", "openfolks", "desktop-runtime");
const BRANDED_EXE = join(RUNTIME_DIR, "OpenFolks.exe");

function syncPngMark() {
  if (!existsSync(MARK)) {
    throw new Error(`missing OpenFolks mark: ${MARK}`);
  }
  copyFileSync(MARK, APP_ICON_PNG);
}

async function electronPath() {
  const binary = require("electron");
  if (typeof binary !== "string" || !existsSync(binary)) {
    throw new Error("electron binary not found — run pnpm install");
  }
  return binary;
}

async function brandedWindowsElectron(source) {
  if (!existsSync(APP_ICON_ICO)) {
    throw new Error(`missing Windows icon: ${APP_ICON_ICO}`);
  }
  const stampFile = join(RUNTIME_DIR, ".icon-stamp");
  const stamp = createHash("sha256")
    .update(readFileSync(APP_ICON_ICO))
    .update("openfolks-runtime-v3")
    .digest("hex");
  if (existsSync(BRANDED_EXE) && existsSync(stampFile) && readFileSync(stampFile, "utf8") === stamp) {
    return BRANDED_EXE;
  }
  rmSync(RUNTIME_DIR, { recursive: true, force: true });
  mkdirSync(RUNTIME_DIR, { recursive: true });
  cpSync(dirname(source), RUNTIME_DIR, { recursive: true });
  const copied = join(RUNTIME_DIR, "electron.exe");
  if (!existsSync(copied)) {
    throw new Error(`copied Electron runtime is missing electron.exe at ${copied}`);
  }
  renameSync(copied, BRANDED_EXE);
  const { rcedit } = await import("rcedit");
  await rcedit(BRANDED_EXE, {
    icon: APP_ICON_ICO,
    "version-string": {
      ProductName: "OpenFolks",
      FileDescription: "OpenFolks",
      InternalName: "OpenFolks",
      OriginalFilename: "OpenFolks.exe",
    },
  });
  writeFileSync(stampFile, stamp);
  return BRANDED_EXE;
}

syncPngMark();
const source = await electronPath();
const binary = process.platform === "win32" ? await brandedWindowsElectron(source) : source;
const child = spawn(binary, ["."], {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    ...(process.platform === "win32" ? { OPENFOLKS_DEV_DESKTOP: "1" } : {}),
  },
  windowsHide: false,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
