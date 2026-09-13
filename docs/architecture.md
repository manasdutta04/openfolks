# Architecture

OpenFolks is a desktop workplace. The repo is split by surface:

| Path | Role |
|------|------|
| [`apps/desk`](../apps/desk) | React Desk — chat, HQ, settings, computer panel, Marketplace |
| [`apps/harness`](../apps/harness) | Local API, engines, MCP, data under `~/.openfolks` |
| [`apps/shell`](../apps/shell) | Electron main process, preload, packagers |
| [`apps/docs`](../apps/docs) | Public documentation site |
| [`crews`](../crews) | Marketplace crew packs (`crew.openfolks.json`) |
| [`portals`](../portals) | Portal CLIs shipped with the app |
| [`packages/folks-kit`](../packages/folks-kit) | Playbooks and kit assets |
| [`shared`](../shared) | Shared TypeScript contracts |
| [`cloudflare`](../cloudflare) | Optional hosted Workers |

## Runtime

```text
Desk (UI :5199)   ── HTTP /api ──▶  Harness (:8799)
Shell (Electron)  ── starts    ──▶  Harness + loads Desk
```

- **Folk** — one teammate: model, computer, skills, memory.
- **Crew** — a packaged set of folks and skills from Marketplace or `crews/`.
- **Desk** — HQ for needs-you, working, unread, crew map, handoffs.
- **Backstage** — live turn tape and engine protocol for the open thread.

There is no mobile companion. Packages target Windows, macOS, and Linux.
