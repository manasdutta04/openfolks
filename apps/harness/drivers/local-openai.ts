// Shared factory for local OpenAI-compatible hosts (Ollama, LM Studio, …).
// Dummy Bearer keys satisfy the chat runtime; availability comes from probing
// the daemon, not from a user-pasted secret.
import type {
  DriverCreateInput,
  EngineInstall,
  ModelCatalog,
  ProviderDriver,
  ProviderInstance,
} from "../contracts.ts";
import { createOpenAIChatRuntime } from "./openai-chat.ts";

export interface LocalOpenAIConfig {
  url: string;
}

export interface LocalOpenAIHostSpec {
  driverKind: string;
  displayName: string;
  defaultUrl: string;
  /** Ollama / LM Studio ignore this; the chat runtime still sends Bearer. */
  apiKey: string;
  unavailableReason: string;
  install: EngineInstall;
  /** Optional extra catalog URL (e.g. LM Studio `/api/v0/models` for loaded). */
  loadedCatalogUrl?: (apiUrl: string) => string | null;
  envUrlKey?: string;
}

const EMPTY_CATALOG: ModelCatalog = { default: "", options: [] };

export function normalizeLocalApiUrl(value: string): string {
  let root = value.trim().replace(/\/+$/, "");
  if (!root) return root;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(root)) root = `http://${root}`;
  return root.endsWith("/v1") ? root : `${root}/v1`;
}

export function decodeLocalOpenAIConfig(raw: unknown, defaultUrl: string, envUrlKey?: string): LocalOpenAIConfig {
  const config = (raw ?? {}) as Record<string, unknown>;
  const fromConfig = typeof config.url === "string" && config.url.trim() ? config.url : "";
  const fromEnv = envUrlKey ? process.env[envUrlKey]?.trim() ?? "" : "";
  return { url: normalizeLocalApiUrl(fromConfig || fromEnv || defaultUrl) };
}

function parseModelRows(json: unknown): ModelCatalog["options"] {
  const rows = Array.isArray(json)
    ? json
    : json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)
      ? (json as { data: unknown[] }).data
      : json && typeof json === "object" && Array.isArray((json as { models?: unknown }).models)
        ? (json as { models: unknown[] }).models
        : [];
  const seen = new Set<string>();
  const options: ModelCatalog["options"] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as { id?: unknown; name?: unknown; model?: unknown; loaded?: unknown; state?: unknown };
    const id =
      typeof item.id === "string" && item.id
        ? item.id
        : typeof item.model === "string" && item.model
          ? item.model
          : typeof item.name === "string" && item.name
            ? item.name
            : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const state = typeof item.state === "string" ? item.state.toLowerCase() : "";
    const loaded = item.loaded === true || state === "loaded";
    options.push({
      id,
      label: typeof item.name === "string" && item.name.trim() && item.name !== id ? item.name : id,
      custom: true,
      ...(loaded ? { loaded: true } : {}),
    });
  }
  return options;
}

/** Probe a local OpenAI `/models` endpoint (and optional loaded catalog). */
export async function probeLocalModels(
  apiUrl: string,
  apiKey: string,
  loadedCatalogUrl?: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<{ reachable: boolean; catalog: ModelCatalog }> {
  try {
    const response = await fetchImpl(`${apiUrl}/models`, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return { reachable: false, catalog: EMPTY_CATALOG };
    const json = await response.json();
    let options = parseModelRows(json);

    if (loadedCatalogUrl) {
      try {
        const extra = await fetchImpl(loadedCatalogUrl, {
          headers: { authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(3_000),
        });
        if (extra.ok) {
          const loadedRows = parseModelRows(await extra.json());
          const loadedIds = new Set(loadedRows.filter((row) => row.loaded).map((row) => row.id));
          if (loadedIds.size) {
            options = options.map((row) => (loadedIds.has(row.id) ? { ...row, loaded: true } : row));
            for (const row of loadedRows) {
              if (!options.some((existing) => existing.id === row.id)) options.push(row);
            }
          }
        }
      } catch {
        /* loaded enrichment is best-effort */
      }
    }

    return {
      reachable: true,
      catalog: options.length
        ? { default: options.find((row) => row.loaded)?.id ?? options[0]!.id, options }
        : EMPTY_CATALOG,
    };
  } catch {
    return { reachable: false, catalog: EMPTY_CATALOG };
  }
}

export function defineLocalOpenAIDriver(spec: LocalOpenAIHostSpec): ProviderDriver<LocalOpenAIConfig> {
  return {
    driverKind: spec.driverKind,
    metadata: {
      displayName: spec.displayName,
      supportsMultipleInstances: true,
      access: "custom",
    },
    models: EMPTY_CATALOG,
    install: spec.install,
    decodeConfig: (raw) => decodeLocalOpenAIConfig(raw, spec.defaultUrl, spec.envUrlKey),
    defaultConfig: () => decodeLocalOpenAIConfig({}, spec.defaultUrl, spec.envUrlKey),

    async create(input: DriverCreateInput<LocalOpenAIConfig>): Promise<ProviderInstance> {
      const apiUrl = input.config.url;
      let catalog: ModelCatalog = EMPTY_CATALOG;
      let reachable = false;

      const refresh = async () => {
        const probed = await probeLocalModels(
          apiUrl,
          spec.apiKey,
          spec.loadedCatalogUrl?.(apiUrl) ?? null,
        );
        reachable = probed.reachable;
        catalog = probed.catalog;
      };

      void refresh();

      const runtime = createOpenAIChatRuntime({
        input,
        driverKind: spec.driverKind,
        apiKey: spec.apiKey,
        apiUrl,
        models: () => catalog,
        refreshModels: refresh,
        requestBody: (model, messages, stream) => ({ model, messages, stream }),
        httpErrorLabel: spec.displayName,
        missingKeyError: spec.unavailableReason,
        unavailableReason: spec.unavailableReason,
        timeoutMs: 300_000,
        nativeLog: {
          source: `${spec.driverKind}.chat.completions`,
          outgoing: (_turn, messages, model) => ({ model, messageCount: messages.length }),
          incoming: ({ text, usage }) => ({ textLength: text.length, usage }),
        },
      });

      return {
        ...runtime,
        get models() {
          return catalog;
        },
        refreshModels: refresh,
        snapshot: async () => {
          await refresh();
          return reachable
            ? { state: "available", authenticated: true, version: null }
            : { state: "unavailable", reason: spec.unavailableReason };
        },
      };
    },
  };
}
