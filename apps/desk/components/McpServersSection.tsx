import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Plug,
  Plus,
  Power,
  PowerOff,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api, useStore, type McpServerPublic } from "@/state/store";
import { Card } from "./SettingsPrimitives";
import { cn } from "@/lib/cn";

type Draft = {
  name: string;
  kind: "stdio" | "url";
  command: string;
  argsText: string;
  url: string;
  envText: string;
  headerText: string;
  enabled: boolean;
};

type Preset = {
  id: string;
  label: string;
  blurb: string;
  draft: Draft;
};

const emptyDraft = (): Draft => ({
  name: "",
  kind: "stdio",
  command: "",
  argsText: "",
  url: "",
  envText: "",
  headerText: "",
  enabled: true,
});

const PRESETS: Preset[] = [
  {
    id: "apify",
    label: "Apify",
    blurb: "Store scrapers & Actors over hosted MCP",
    draft: {
      name: "apify",
      kind: "url",
      command: "",
      argsText: "",
      url: "https://mcp.apify.com/",
      envText: "",
      headerText: "Authorization=Bearer ",
      enabled: true,
    },
  },
  {
    id: "filesystem",
    label: "Filesystem",
    blurb: "Read/write a folder via official filesystem MCP",
    draft: {
      name: "filesystem",
      kind: "stdio",
      command: "npx",
      argsText: "-y @modelcontextprotocol/server-filesystem C:/Users/Public",
      url: "",
      envText: "",
      headerText: "",
      enabled: true,
    },
  },
  {
    id: "github",
    label: "GitHub",
    blurb: "Issues, PRs, and repo tools",
    draft: {
      name: "github",
      kind: "stdio",
      command: "npx",
      argsText: "-y @modelcontextprotocol/server-github",
      url: "",
      envText: "GITHUB_PERSONAL_ACCESS_TOKEN=",
      headerText: "",
      enabled: true,
    },
  },
  {
    id: "brave",
    label: "Brave Search",
    blurb: "Web search for research folks",
    draft: {
      name: "brave",
      kind: "stdio",
      command: "npx",
      argsText: "-y @modelcontextprotocol/server-brave-search",
      url: "",
      envText: "BRAVE_API_KEY=",
      headerText: "",
      enabled: true,
    },
  },
  {
    id: "fetch",
    label: "Fetch",
    blurb: "HTTP fetch helper for pages and APIs",
    draft: {
      name: "fetch",
      kind: "stdio",
      command: "npx",
      argsText: "-y @modelcontextprotocol/server-fetch",
      url: "",
      envText: "",
      headerText: "",
      enabled: true,
    },
  },
  {
    id: "memory",
    label: "Memory",
    blurb: "Persistent knowledge graph memory",
    draft: {
      name: "memory",
      kind: "stdio",
      command: "npx",
      argsText: "-y @modelcontextprotocol/server-memory",
      url: "",
      envText: "",
      headerText: "",
      enabled: true,
    },
  },
];

function parseKv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function fromPublic(server: McpServerPublic): Draft {
  return {
    name: server.name,
    kind: server.kind,
    command: server.command ?? "",
    argsText: (server.args ?? []).join(" "),
    url: server.url ?? "",
    envText: "",
    headerText: "",
    enabled: server.enabled,
  };
}

function draftToPayload(item: Draft): Record<string, unknown> {
  if (item.kind === "url") {
    return {
      kind: "url",
      url: item.url.trim(),
      ...(Object.keys(parseKv(item.headerText)).length ? { headers: parseKv(item.headerText) } : {}),
      enabled: item.enabled,
    };
  }
  return {
    kind: "stdio",
    command: item.command.trim(),
    args: item.argsText.trim() ? item.argsText.trim().split(/\s+/) : [],
    ...(Object.keys(parseKv(item.envText)).length ? { env: parseKv(item.envText) } : {}),
    enabled: item.enabled,
  };
}

/** Dedicated Settings → MCP page: presets, list, and stdio/URL editors. */
export function McpServersSection() {
  const { state } = useStore();
  const [servers, setServers] = useState<McpServerPublic[]>(state.config?.mcpServers ?? []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.config?.mcpServers) setServers(state.config.mcpServers);
  }, [state.config?.mcpServers]);

  const refresh = useCallback(async () => {
    const data = (await api("/api/mcp-servers")) as { servers: McpServerPublic[] };
    setServers(data.servers);
  }, []);

  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);

  const knownNames = useMemo(() => new Set(servers.map((server) => server.name)), [servers]);

  const putServers = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const data = (await api("/api/mcp-servers", {
        method: "PUT",
        body: JSON.stringify({ servers: payload }),
      })) as { servers: McpServerPublic[] };
      setServers(data.servers);
      setDraft(null);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save MCP servers");
    } finally {
      setBusy(false);
    }
  };

  const buildFullPayload = (overrides: Record<string, unknown>, removeName?: string) => {
    const payload: Record<string, unknown> = { ...overrides };
    for (const existing of servers) {
      if (removeName && existing.name === removeName) continue;
      if (payload[existing.name]) continue;
      payload[existing.name] =
        existing.kind === "url"
          ? { kind: "url", url: existing.url, enabled: existing.enabled }
          : {
              kind: "stdio",
              command: existing.command,
              args: existing.args ?? [],
              enabled: existing.enabled,
            };
    }
    return payload;
  };

  const saveDraft = async (item: Draft) => {
    const name = item.name.trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    await putServers(buildFullPayload({ [name]: draftToPayload({ ...item, name }) }));
  };

  const removeServer = async (name: string) => {
    await putServers(buildFullPayload({}, name));
  };

  const setEnabled = async (server: McpServerPublic, enabled: boolean) => {
    const entry =
      server.kind === "url"
        ? { kind: "url" as const, url: server.url, enabled }
        : {
            kind: "stdio" as const,
            command: server.command,
            args: server.args ?? [],
            enabled,
          };
    await putServers(buildFullPayload({ [server.name]: entry }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Model Context Protocol"
        subtitle="Extra tools for every capable folk — scrapers, search, repos, files, and hosted MCP endpoints like Apify. Tools ask for approval unless you always-allow them."
      >
        <div className="flex flex-wrap gap-2 text-[12px] text-ink-secondary">
          <span className="rounded-full bg-raised px-2.5 py-1">Claude · Codex · ACP engines</span>
          <span className="rounded-full bg-raised px-2.5 py-1">Stdio or HTTPS URL</span>
          <span className="rounded-full bg-raised px-2.5 py-1">Secrets stay on this computer</span>
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 hover:text-ink"
          >
            MCP docs <ExternalLink size={11} />
          </a>
        </div>
      </Card>

      <Card title="Quick add" subtitle="Start from a common server, then paste your token if it asks for one.">
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const taken = knownNames.has(preset.draft.name);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={taken}
                onClick={() => {
                  setEditing(null);
                  setDraft({ ...preset.draft });
                }}
                className={cn(
                  "rounded-xl border border-hairline/50 bg-inset/40 px-3 py-3 text-left transition hover:border-accent/40 hover:bg-raised/40",
                  taken && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" />
                  <span className="text-[13.5px] font-medium text-ink">{preset.label}</span>
                  {taken && <span className="text-[10.5px] text-ink-secondary">added</span>}
                </div>
                <p className="mt-1 text-[12px] leading-snug text-ink-secondary">{preset.blurb}</p>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDraft(emptyDraft());
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-hairline/50 px-3 py-2 text-[13px] text-ink hover:bg-raised"
        >
          <Plus size={14} />
          Custom server
        </button>
      </Card>

      <Card
        title="Connected servers"
        subtitle={
          servers.length
            ? `${servers.filter((s) => s.enabled).length} active · ${servers.length} total`
            : "None yet — pick a preset above or add a custom stdio/URL server."
        }
      >
        <div className="space-y-2">
          {servers.map((server) => (
            <div
              key={server.name}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-hairline/40 bg-inset/30 px-3 py-2.5",
                !server.enabled && "opacity-60",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
                <Plug size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[13.5px] font-medium text-ink">{server.name}</span>
                  <span className="rounded-full bg-control px-1.5 py-0.5 text-[10.5px] uppercase tracking-wide text-ink-secondary">
                    {server.kind}
                  </span>
                  {!server.enabled && (
                    <span className="text-[10.5px] font-medium text-warning">Paused</span>
                  )}
                </div>
                <div className="truncate text-[11.5px] text-ink-secondary">
                  {server.kind === "url"
                    ? server.url
                    : `${server.command ?? ""} ${(server.args ?? []).join(" ")}`.trim()}
                  {server.envKeys.length > 0 ? ` · env ${server.envKeys.join(", ")}` : ""}
                  {server.headerKeys.length > 0 ? ` · headers ${server.headerKeys.join(", ")}` : ""}
                </div>
              </div>
              <button
                type="button"
                title={server.enabled ? "Pause" : "Enable"}
                disabled={busy}
                onClick={() => void setEnabled(server, !server.enabled)}
                className="rounded-md p-1.5 text-ink-secondary hover:bg-raised hover:text-ink"
              >
                {server.enabled ? <Power size={14} /> : <PowerOff size={14} />}
              </button>
              <button
                type="button"
                className="text-[12px] text-ink-secondary hover:text-ink"
                onClick={() => {
                  setEditing(server.name);
                  setDraft(fromPublic(server));
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-md p-1.5 text-ink-secondary hover:bg-raised hover:text-danger"
                title={`Remove ${server.name}`}
                onClick={() => void removeServer(server.name)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {draft && (
        <Card title={editing ? `Edit “${editing}”` : "New MCP server"} subtitle="Leave env/header fields blank when editing to keep existing secrets.">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-[12px] text-ink-secondary">
                Name
                <input
                  value={draft.name}
                  disabled={Boolean(editing)}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value.toLowerCase() })}
                  placeholder="apify"
                  className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[13px] text-ink"
                />
              </label>
              <label className="block text-[12px] text-ink-secondary">
                Transport
                <select
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as "stdio" | "url" })}
                  className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 text-[13px] text-ink"
                >
                  <option value="url">Remote URL (HTTP/SSE)</option>
                  <option value="stdio">Local command (stdio)</option>
                </select>
              </label>
            </div>
            {draft.kind === "url" ? (
              <>
                <label className="block text-[12px] text-ink-secondary">
                  URL
                  <input
                    value={draft.url}
                    onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    placeholder="https://mcp.apify.com/"
                    className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[13px] text-ink"
                  />
                </label>
                <label className="block text-[12px] text-ink-secondary">
                  Headers (KEY=value per line)
                  <textarea
                    value={draft.headerText}
                    onChange={(e) => setDraft({ ...draft, headerText: e.target.value })}
                    rows={3}
                    placeholder={"Authorization=Bearer apify_api_…"}
                    className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[12.5px] text-ink"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block text-[12px] text-ink-secondary">
                  Command
                  <input
                    value={draft.command}
                    onChange={(e) => setDraft({ ...draft, command: e.target.value })}
                    placeholder="npx"
                    className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[13px] text-ink"
                  />
                </label>
                <label className="block text-[12px] text-ink-secondary">
                  Args (space-separated)
                  <input
                    value={draft.argsText}
                    onChange={(e) => setDraft({ ...draft, argsText: e.target.value })}
                    placeholder="-y @modelcontextprotocol/server-github"
                    className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[13px] text-ink"
                  />
                </label>
                <label className="block text-[12px] text-ink-secondary">
                  Env (KEY=value per line)
                  <textarea
                    value={draft.envText}
                    onChange={(e) => setDraft({ ...draft, envText: e.target.value })}
                    rows={3}
                    placeholder={"GITHUB_PERSONAL_ACCESS_TOKEN=…"}
                    className="mt-1 w-full rounded-lg border border-hairline/50 bg-card px-2.5 py-1.5 font-mono text-[12.5px] text-ink"
                  />
                </label>
              </>
            )}
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              />
              Enable after save
            </label>
            {error && <p className="text-[12.5px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-[13px] text-ink-secondary hover:bg-raised"
                onClick={() => {
                  setDraft(null);
                  setEditing(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !draft.name.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-fg disabled:opacity-50"
                onClick={() => void saveDraft(draft)}
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save server
              </button>
            </div>
          </div>
        </Card>
      )}

      {error && !draft && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}
