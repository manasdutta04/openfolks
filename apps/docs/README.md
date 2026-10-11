# OpenFolks website

One Next.js site (Next 16, Fumadocs) that serves the public website and the user documentation.

| Path | What it is |
|---|---|
| `app/(site)` | Home, features, download, security, privacy, terms |
| `app/docs`, `content/docs` | Documentation (MDX) |
| `components/site` | Shared site components, including the mascot and the interactive Desk demo |
| `lib/features.ts` | Text of the feature pages. Keep it in step with `content/docs` |
| `lib/site.ts` | Navigation, repository and download URLs |

Contributor notes stay in the repo-root [`docs/`](../../docs) folder.

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

## Deploy on Vercel

The site is static apart from the search route. Publishing it does not ship the desktop app, credentials or user data.

1. In Vercel, choose **Add New, Project** and import `manasdutta04/openfolks`.
2. Set **Root Directory** to `apps/docs` and leave "Include source files outside of the Root Directory" on. The build reads `../../crews` and `../../public/openfolk.png`.
3. Framework Preset: Next.js. Node.js version: 24.
4. Add the environment variable `NEXT_PUBLIC_SITE_URL` with the final address, for example `https://openfolks.com`. It sets canonical URLs, the sitemap and Open Graph links.
5. Deploy `main`, check the preview address, then add the domain under **Settings, Domains**.
6. Update the `Canonical` and `Policy` lines in `public/.well-known/security.txt` if the domain differs.

`vercel.json` pins the install and build commands for the workspace.

## Editing rules for page copy

- Plain, specific sentences. Say what the software does and where it stops.
- Every claim about behaviour must match the code or the documentation. The privacy page lists what the app sends; update it in the same change that alters it (`apps/desk/lib/analytics.ts` is the source for usage events).
