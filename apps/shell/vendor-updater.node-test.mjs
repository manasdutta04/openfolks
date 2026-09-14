// The vendored electron-updater bundle is a build artifact, but it is also the
// code that actually runs in the packaged app. These tests pin the one
// behaviour we deliberately changed in it: an AppImage update must land on the
// path the user launches, never a new versioned filename.
//
// See scripts/patch-appimage-updater.mjs for the reasoning.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import Module, { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { patchAppImageUpdater } from "../scripts/patch-appimage-updater.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = readFileSync(join(root, "vendor/electron-updater.cjs"), "utf8");

// Non-global on purpose: a shared /g regex carries lastIndex between .test()
// calls and would report alternating results.
const renamePattern = /destination = (\w+)\.join\(\1\.dirname\(appImageFile\), \1\.basename\(installerPath\)\);/;

test("the vendored bundle still contains the AppImage installer we patch", () => {
  assert.match(bundle, /const appImageFile = process\.env\["APPIMAGE"\]/);
  assert.match(bundle, /destination = appImageFile;/);
});

test("the install stages the replacement instead of deleting first", () => {
  // Upstream's unlinkSync(appImageFile) runs before the download is even
  // validated. Nothing may remove the running file ahead of the rename.
  assert.doesNotMatch(bundle, /unlinkSync\)\(appImageFile\)/);
  assert.match(bundle, /renameSync\)\(stagedDestination, destination\)/);
});

test("an AppImage update can never be written to a different filename", () => {
  // Upstream renames when the running file has a version in its name, which
  // orphans every .desktop entry, symlink and dock pin pointing at it.
  assert.doesNotMatch(bundle, renamePattern);
});

// The shape of the three sites the patch rewrites, as esbuild emits them.
const UPSTREAM = [
  "        (0, fs_1.unlinkSync)(appImageFile);",
  "        let destination;",
  "        const existingBaseName = path2.basename(appImageFile);",
  "        const installerPath = this.installerPath;",
  "        if (path2.basename(installerPath) === existingBaseName || !/\\d+\\.\\d+\\.\\d+/.test(existingBaseName)) {",
  "          destination = appImageFile;",
  "        } else {",
  "          destination = path2.join(path2.dirname(appImageFile), path2.basename(installerPath));",
  "        }",
  '        (0, child_process_1.execFileSync)("mv", ["-f", installerPath, destination]);',
].join("\n");

test("the patch keeps the running path and never deletes ahead of the rename", () => {
  const patched = patchAppImageUpdater(UPSTREAM);

  assert.doesNotMatch(patched, renamePattern);
  assert.equal(patched.match(/destination = appImageFile;/g)?.length, 2);
  assert.doesNotMatch(patched, /unlinkSync\)\(appImageFile\)/);
  assert.match(patched, /mv", \["-f", installerPath, stagedDestination\]/);
  assert.match(patched, /renameSync\)\(stagedDestination, destination\)/);
});

test("the patch tolerates esbuild renaming the path import", () => {
  const patched = patchAppImageUpdater(UPSTREAM.replaceAll("path2", "path7"));

  assert.doesNotMatch(patched, renamePattern);
  assert.equal(patched.match(/destination = appImageFile;/g)?.length, 2);
});

test("the patch fails closed when upstream's shape moves", () => {
  // A silent no-op here would ship the launcher-breaking rename again, or
  // reinstate the delete that can cost a user their application.
  for (const [label, mutated] of [
    ["no rename branch", UPSTREAM.replace(/destination = path2\.join[^;]+;/, "destination = elsewhere;")],
    ["no early unlink", UPSTREAM.replace("        (0, fs_1.unlinkSync)(appImageFile);\n", "")],
    ["no move", UPSTREAM.replace(/\(0, child_process_1\.execFileSync\)\("mv"[^;]+;/, "")],
    ["two rename branches", `${UPSTREAM}\n${UPSTREAM}`],
  ]) {
    assert.throws(() => patchAppImageUpdater(mutated), /to patch, found/, label);
  }
});

test("the shipped installer moves the update onto the running AppImage's path", (t) => {
  const electron = { app: {}, autoUpdater: new EventEmitter() };
  const load = Module._load;
  Module._load = (request, ...rest) => (request === "electron" ? electron : load(request, ...rest));
  t.after(() => {
    Module._load = load;
  });

  const { AppImageUpdater } = createRequire(import.meta.url)("./vendor/electron-updater.cjs");
  const workspace = mkdtempSync(join(tmpdir(), "omb-appimage-install-"));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));

  // The user launches a versioned filename — the case upstream renames.
  const launched = join(workspace, "OpenFolks-0.1.43-x86_64.AppImage");
  const staged = join(workspace, "pending", "OpenFolks-0.1.44-x86_64.AppImage");
  mkdirSync(join(workspace, "pending"));
  writeFileSync(launched, "old", { mode: 0o755 });
  writeFileSync(staged, "new", { mode: 0o755 });

  const previous = process.env.APPIMAGE;
  process.env.APPIMAGE = launched;
  t.after(() => {
    if (previous === undefined) delete process.env.APPIMAGE;
    else process.env.APPIMAGE = previous;
  });

  const renames = [];
  let relaunched = null;
  AppImageUpdater.prototype.doInstall.call(
    {
      installerPath: staged,
      _logger: { info() {}, warn() {}, error() {}, debug() {} },
      dispatchError: (error) => assert.fail(error),
      emit: (event, value) => renames.push([event, value]),
      spawnLog: (target) => {
        relaunched = target;
      },
    },
    { isForceRunAfter: true },
  );

  assert.equal(readFileSync(launched, "utf8"), "new", "the update must land on the launched path");
  assert.equal(existsSync(staged), false, "the staged download must be consumed");
  assert.deepEqual(readdirSync(workspace).sort(), ["OpenFolks-0.1.43-x86_64.AppImage", "pending"]);
  assert.equal(relaunched, launched, "the relaunch must use the path the launcher points at");
  assert.deepEqual(renames, [], "no filename change means no appimage-filename-updated event");
});

test("the running AppImage is never removed before its replacement is in place", (t) => {
  const electron = { app: {}, autoUpdater: new EventEmitter() };
  const load = Module._load;
  Module._load = (request, ...rest) => (request === "electron" ? electron : load(request, ...rest));
  t.after(() => {
    Module._load = load;
  });

  const { AppImageUpdater } = createRequire(import.meta.url)("./vendor/electron-updater.cjs");
  const workspace = mkdtempSync(join(tmpdir(), "omb-appimage-failed-"));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));

  const launched = join(workspace, "OpenFolks-0.1.43-x86_64.AppImage");
  writeFileSync(launched, "the app the user has", { mode: 0o755 });

  const previous = process.env.APPIMAGE;
  process.env.APPIMAGE = launched;
  t.after(() => {
    if (previous === undefined) delete process.env.APPIMAGE;
    else process.env.APPIMAGE = previous;
  });

  // A staged download that is not there stands in for every way the move can
  // fail — a full disk, a cross-filesystem copy cut short, a revoked mount.
  // Upstream unlinks the running file first, so any of those left the user
  // with no application at all.
  assert.throws(() =>
    AppImageUpdater.prototype.doInstall.call(
      {
        installerPath: join(workspace, "never-downloaded.AppImage"),
        _logger: { info() {}, warn() {}, error() {}, debug() {} },
        dispatchError: (error) => {
          throw error;
        },
        emit() {},
        spawnLog: () => assert.fail("a failed install must not relaunch"),
      },
      { isForceRunAfter: true },
    ),
  );

  assert.equal(readFileSync(launched, "utf8"), "the app the user has", "a failed update cost the user their app");
  assert.deepEqual(readdirSync(workspace), [basename(launched)], "a partial download was left behind");
});
