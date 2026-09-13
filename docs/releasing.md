# Releasing

Desktop packages use electron-builder for **Windows**, **macOS**, and **Linux**.

```bash
pnpm package:win
pnpm package:mac
pnpm package:linux
```

`package:prepare` builds Desk, the harness, updater assets, and cloudflared before the platform packager runs.

- Product: OpenFolks (`com.openfolks.app`)
- License: MIT
- Auto-update metadata publishes to the releases repo in `electron-builder.yml`
- Windows ship notes live under `.claude/skills/windows-release/`

Smoke the packaged harness (`pnpm test:packaged-server`) when you change boot or resource paths under `apps/shell`.
