# Contributing to OpenFolks

OpenFolks is MIT-licensed. By sending a change you agree it ships under that same license.

This file is the working agreement: how to run the app, what a good change looks like, and what we check before merge.

## How we work

- **One concern per PR.** A platform port plus a feature plus a refactor will be asked to split. Large work starts as an issue so we can agree the shape first.
- **Stay small.** The harness is plain Node. The desk is one store and one event stream. Prefer thirty lines over a new dependency. New runtime packages need a reason in the PR.
- **Keep it green.** `pnpm typecheck && pnpm test` must pass. Server behavior needs a test.
- **UI needs pictures.** Before/after in the PR body; video if it moves. Match [`apps/desk/styles.css`](apps/desk/styles.css).

## Dev setup

**Node 24+**, **pnpm**, and — if you want a live conversation — at least one signed-in agent CLI such as [`claude`](https://claude.com/claude-code) or [`codex`](https://github.com/openai/codex). The harness is portable Node. Desktop targets are Windows, macOS, and Linux.

```sh
git clone http://github.com/manasdutta04/openfolks && cd openfolks
pnpm install

pnpm dev:server    # harness → 127.0.0.1:8799
pnpm dev           # desk → http://127.0.0.1:5199
pnpm dev:desktop   # Electron (leave harness + Vite running)

pnpm typecheck
pnpm test
pnpm test:watch
pnpm check:electron

pnpm package:mac
pnpm package:win
pnpm package:linux
```

`pnpm dev:desktop` verifies the pinned Cloudflare Tunnel binary for this platform before Electron starts. Day-to-day notes: [`docs/development.md`](docs/development.md). Shipping: [`docs/releasing.md`](docs/releasing.md).

## Where things live

| Path | Role |
|---|---|
| `apps/harness/contracts.ts` | Driver SPI and runtime events — read this first |
| `apps/harness/drivers/` | One file per engine; register in `builtIn.ts` |
| `apps/harness/` | Local API, engines, MCP, persistence |
| `apps/desk/` | React Desk (HTTP out, SSE in — no transports of its own) |
| `apps/shell/` | Electron main process and packaging helpers |
| `crews/` | Marketplace crew packs |
| `portals/` | Portal CLIs shipped with the app |
| `packages/folks-kit/` | Playbooks and project templates |
| `docs/` | Short contributor notes |
| `dist-server/` | **Build output.** Never edit by hand |

Data lives in `~/.openfolks/` (folks, transcripts, per-thread event logs, config).

## Tests

Colocated next to the code (`apps/harness/**/*.test.ts`, `apps/desk/**/*.test.ts`). `pnpm test` runs them.

- **Unit** — registry, bus, store. Use the fake driver in [`apps/harness/testing/fake-driver.ts`](apps/harness/testing/fake-driver.ts).
- **Driver contract** — scripted fake CLIs under `apps/harness/testing/`. Assert the canonical event stream, argv/env hygiene, interrupts, and the permission broker. Toggle failure modes with env (`FAKE_CLAUDE_MODE=exit-early`). Do not mock `child_process`.
- **API smoke** — [`apps/harness/index.test.ts`](apps/harness/index.test.ts) boots a real harness against a throwaway home directory.

Rules:

- **No sleeps.** Wait on the event that proves the behavior (`recordEvents(...).until(...)` in `apps/harness/testing/events.ts`).
- **Never touch a live `~/.openfolks`.** The setup file points `HOME` at a temp dir.
- Fake CLI shebangs go through `spawnCli` / `execCli` so Windows resolves them through Node. Gate a test only when the behavior itself is platform-specific.

## Adding an engine driver

The SPI in [`apps/harness/contracts.ts`](apps/harness/contracts.ts) is small on purpose.

1. Add `apps/harness/drivers/<name>.ts` implementing `ProviderDriver` and register it in [`builtIn.ts`](apps/harness/drivers/builtIn.ts).
2. `decodeConfig` **throws** on invalid config; `create` **rejects** (never throws synchronously) on failure. The registry turns both into an unavailable shadow. Do not bypass that — it is how configs stay compatible.
3. Emit only canonical `RuntimeEvent`s with your own `driverKind`. The bus drops cross-driver events.
4. A missing CLI is `snapshot() → { state: "unavailable", reason }`. A failed spawn is a failed turn. Never a hang, never a crash.
5. Bring a contract test: scripted fake process + `recordEvents`.

## Control CLI and verification

Before claiming a harness or conversation change works, use an isolated fixture — [`docs/verifying.md`](docs/verifying.md). `pnpm control:folks` talks to that fixture.

For new automation CLIs:

- Reuse an existing MCP or API operation; keep the CLI to parsing and formatting.
- Mutating commands need an explicit `--url` or `OPENFOLKS_URL`. Never default to the user's live app.
- JSON on success and failure, non-zero exits, `--help`.
- Errors name the failed action and the next valid step.
- Delete/overwrite commands offer `--dry-run` and a test that it leaves state alone.
- Prefer task-level subcommands and one smoke test for the main path.

Add a control-surface entry only when the shared CLI can exercise it and a permanent test proves it.

## MCP tool schemas

Tool `inputSchema`s pass through every engine's own converter. Those converters flatten, drop, or prune composition keywords.

- **Never use `oneOf`, `anyOf`, `allOf`, `const`, or `format`.** One flat object; per-variant rules go in `description`. String `enum` is fine.
- **Coerce before you reject.** Models stringify objects and vary case. If the meaning is obvious, accept it and normalize.
- **Errors teach.** Refuse with a supported shape and a literal example the model can copy.
- Schema tests should assert the surface stays flat (see `apps/harness/drivers/agents-proxy.test.ts`).

## Adding a language

Strings live in `apps/desk/locales/`. English (`en.json`) is the source of truth.

1. Copy `en.json` to `<code>.json` (lowercase BCP-47: `de.json`, `pt-br.json`). Missing keys fall back to English.
2. Register it in `apps/desk/locales/index.ts`.
3. Run `pnpm i18n:check`, then pick the language in **Settings → General**.

A first draft helper (no repo access, no write tools):

```sh
node scripts/generate-locale.mjs it "Italian"
```

Extract strings with `t("…")` as you touch components. No big sweeps.

## Platform rules

- The harness stays portable Node. macOS-only work (TCC, Swift helpers, `~/Library`) belongs in `apps/shell/` behind `process.platform === "darwin"`.
- The renderer uses the desktop capability contract. Do not infer support from Electron, the user agent, or a preload bridge.
- Ubuntu platform claims need a real GNOME session. Xvfb proves packaging, not Wayland portals or real CUA input.
- Linux local control is GNOME/Xorg only, after explicit opt-in. The owned daemon starts with `--no-overlay`. GNOME/Wayland must clear a leftover opt-in, report `linux-wayland-seat-safety-blocked`, and never start Cua until it passes the real-seat matrix in #345. Global opt-in plus per-folk **This computer** is mandatory.
- Keep CUA discovery shell-free. Packaged Linux prefers the reviewed outside-ASAR runtime and fails closed. No runtime downloader. Never infer Wayland readiness from `WAYLAND_DISPLAY` or XWayland.
- Native release changes update the checked-in Cua license report/SBOM, keep MIT/OFL/MPL notices, pass malicious-archive tests, and prove identical hashes across `linux-unpacked`, `.deb`, and AppImage.
- **Never build command strings for a shell.** No `shell: true`, no `cmd.exe` quoted strings. On Windows, resolve `.cmd` shims to their JS entry and spawn `process.execPath`.
- POSIX-only calls (`process.kill(-pid)`, unix sockets) need a gated Windows equivalent.

## Secrets

API keys are write-only. They land in `~/.openfolks/config.json` via `PUT /api/config`. The API reports `configured` booleans only. No logging keys, no echoing them, no baking them into argv.

## Before you open the PR

- [ ] `pnpm typecheck` and `pnpm test` pass
- [ ] Locale changes pass `pnpm i18n:check` and a speaker reviewed them
- [ ] `pnpm check:electron` passes for shell changes
- [ ] Ubuntu packaging changes pass `pnpm package:linux` and `node scripts/verify-linux-package.mjs`
- [ ] New server behavior has a test; driver changes keep contract tests green
- [ ] No `dist-server/` churn, no lockfile churn beyond your dependency change
- [ ] macOS-only code is platform-gated
- [ ] UI changes include before/after screenshots
