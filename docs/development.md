# Development

## Requirements

- Node.js 24+
- pnpm 10+

## Run the desktop stack

```bash
pnpm install
pnpm dev:server   # harness — http://127.0.0.1:8799
pnpm dev          # Desk — http://127.0.0.1:5199
pnpm dev:desktop  # Electron shell
```

Data defaults to `~/.openfolks/` (`OPENFOLKS_DATA_DIR` overrides). Older install folders are still found if `~/.openfolks` is missing.

Source runs can move the harness with `OPENFOLKS_PORT`. Packaged builds pick their own local port if the preferred one is taken.

## Useful scripts

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | Desk + harness TypeScript |
| `pnpm test` | Unit and integration suite |
| `pnpm control:folks` | Isolated verification ([verifying.md](verifying.md)) |
| `pnpm package:win` / `package:mac` / `package:linux` | Desktop installers |
| `pnpm docs:dev` | Public docs site |

## Layout

- Desk UI: `apps/desk` (`@/*` → `apps/desk/*`)
- Server: `apps/harness`
- Electron: `apps/shell`
