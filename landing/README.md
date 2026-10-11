# OpenFolks landing page

A small Vite + React site. It reuses the app's own mascots (`bot-avatars`) and
reads the crew list straight from `../crews/*/crew.openfolks.json`.

```bash
pnpm landing:dev     # http://127.0.0.1:5290
pnpm landing:build   # static output in landing/dist
```

- The hero Desk is an interactive demo: click a folk, watch its thread play, or type a message.
- Download buttons are OS-aware and point at `releases/latest/download/<stable name>`, so they follow every release.
- `.github/workflows/landing.yml` publishes `landing/dist` to GitHub Pages (set Settings → Pages → Source to "GitHub Actions" once).
