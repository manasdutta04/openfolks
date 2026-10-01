# Releasing

Desktop packages use electron-builder for **Windows**, **macOS**, and **Linux**.

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

### Optional macOS signing

If these repository secrets are set, macOS builds are signed and notarized:

- `MAC_CERT_P12_BASE64`, `MAC_CERT_PASSWORD`
- `APPLE_API_KEY_P8_BASE64`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`

Without them, macOS artifacts still ship unsigned.

## Local packaging

```bash
pnpm package:win
pnpm package:mac
pnpm package:linux
```

`package:prepare` builds Desk, the harness, updater assets, and cloudflared before the platform packager runs.

- Product: OpenFolks (`com.openfolks.app`)
- License: MIT
- Auto-update metadata publishes to this GitHub repo (see `electron-builder.yml`)
- Windows ship notes live under `.claude/skills/windows-release/`

Smoke the packaged harness (`pnpm test:packaged-server`) when you change boot or resource paths under `apps/shell`.
