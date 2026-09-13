# OpenFolks

A local-first desktop workplace for AI teammates. You hire **folks**, give them engines, folders, and computers, and run the whole team from one **Desk**.

Windows, macOS, and Linux. Your conversations, keys, and files stay on the machine unless you send them out through an engine or a connected app.

## The workplace

- **Desk** — HQ. Conversations, unread work, crew maps, settings.
- **Folks** — teammates you create. Each has a model, memory, tools, and a computer destination.
- **Crews** — ready-made teams from the Marketplace (Job Search, Dev Crew, and more).
- **Computers** — **This computer**, a **Local VM**, or a cloud desktop under Advanced.
- **MCP** — extra tools you attach so folks can reach your services.

The first Assistant slot starts empty. Install a crew or hire a folk from scratch.

## License

OpenFolks is licensed under the [MIT License](LICENSE). Third-party notices live in [NOTICE](NOTICE).

## Requirements

- Node.js 24+
- pnpm 10+

## Run from source

```bash
pnpm install
pnpm dev:server   # harness API — 127.0.0.1:8799
pnpm dev          # Desk UI — 127.0.0.1:5199
pnpm dev:desktop  # Electron shell (keep the two commands above running)
```

Application data lives in `~/.openfolks/` (`OPENFOLKS_DATA_DIR` overrides). If that folder is missing, OpenFolks still finds data from a previous install.

Contributor notes: [docs/](docs/). Public user guide: [apps/docs](apps/docs).
