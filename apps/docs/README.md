# OpenFolks documentation site

Public user guide. Next.js + Fumadocs. Pages live in `content/docs`. Contributor notes stay in the repo-root [`docs/`](../../docs) folder.

## Develop

From the repository root:

```bash
pnpm install
pnpm docs:dev
```

Opens `http://localhost:3000`.

## Check

```bash
pnpm docs:build
pnpm --filter @openfolks/docs types:check
pnpm --filter @openfolks/docs lint
```

## Deploy

This site is static. Publishing it does not ship the desktop app, harness, credentials, or user data.

1. Import `manasdutta04/openfolks`.
2. Set **Root Directory** to `apps/docs`.
3. Keep the detected Next.js settings.
4. Deploy `main`.
5. Attach `docs.openfolks.com` under **Settings → Domains**.

Keep the marketing site on its own project and link to Docs from there.
