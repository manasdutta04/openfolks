# Releasing

Desktop packages use electron-builder for **Windows**, **macOS**, and **Linux**.
Builds ship **unsigned** by default (no Apple Developer ID or Windows code-signing cert required).

## Automated releases (preferred)

1. Bump `version` in `package.json` (for example `1.0.0`).
2. Commit and push to `main`.
3. Tag and push the matching version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

That starts the **Release** workflow, which builds Windows, macOS, and Linux
installers and publishes a GitHub Release on this repo (with `latest.yml` /
`latest-mac.yml` / `latest-linux.yml` for auto-update).

You can also run **Actions → Release → Run workflow** and choose Publish.

## After users install (unsigned builds)

### macOS

Gatekeeper blocks unidentified developers. After installing from the DMG:

```bash
xattr -cr /Applications/OpenFolks.app
```

Or right-click **OpenFolks.app** → **Open** → confirm **Open**.

### Windows

SmartScreen may warn that the publisher is unknown. Use **More info** → **Run anyway**.

### Linux

Install the `.deb` or run the `.AppImage` as usual; no signing step.

## Local packaging

```bash
pnpm package:win
pnpm package:mac
pnpm package:linux
```

`package:prepare` builds Desk, the harness, updater assets, and cloudflared before the platform packager runs.

- Product: OpenFolks (`com.openfolks.app`)
- Maintainer: manasdutta04
- License: MIT
- Auto-update metadata publishes to this GitHub repo (see `electron-builder.yml`)

Smoke the packaged harness (`pnpm test:packaged-server`) when you change boot or resource paths under `apps/shell`.
