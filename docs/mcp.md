# Custom MCP servers

Folks can use tools beyond the built-ins by attaching Model Context Protocol servers.

## In the app

**Settings → MCP**

- Presets (Filesystem, GitHub, Brave, Fetch, Memory, Apify, and others)
- Pause, edit, remove
- **stdio** servers (local command + args + env)
- **URL** servers (HTTPS endpoints the harness bridges to stdio)

Config lives with the rest of the local data under `~/.openfolks/`.

## For contributors

- URL proxy: `apps/harness/mcp-url-proxy.ts`
- Merge path: harness MCP assembly (`customMcpServers` and related helpers)
- Keep secrets out of commits. Use Settings or env overrides.

Document new presets next to the Settings copy so Desk and docs stay aligned.
