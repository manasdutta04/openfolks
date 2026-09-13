# Verifying changes

Before claiming a harness or conversation change works, exercise it against an **isolated** fixture. Never use the user's live OpenFolks data.

## Control CLI

```bash
# Temporary harness with a fake engine (owns the terminal)
node --experimental-strip-types scripts/control-folks.ts launch

# Against that URL (or any explicit OPENFOLKS_URL)
pnpm control:folks doctor --url http://127.0.0.1:PORT
pnpm control:folks bots --url http://127.0.0.1:PORT
pnpm control:folks new-bot --name Probe --url http://127.0.0.1:PORT
pnpm control:folks send --bot BOT_ID --text "hello" --url http://127.0.0.1:PORT
pnpm control:folks wait --bot BOT_ID --timeout 30 --url http://127.0.0.1:PORT
```

Rules:

- Mutating commands require `--url` or `OPENFOLKS_URL`. They must not target a silent default live app.
- Prefer JSON output and non-zero exits on failure (`--help` for the full map).
- Add a permanent test for anything you add to the control surface.

See also [`AGENTS.md`](../AGENTS.md) and [`CONTRIBUTING.md`](../CONTRIBUTING.md).
