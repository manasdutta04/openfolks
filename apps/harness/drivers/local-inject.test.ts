import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { ensureGrokInjectSlug, GrokAgentDriver } from "./acp/grok.ts";
import { ensureOpenCodeInjectModel } from "./acp/opencode-go.ts";
import { AntigravityDriver } from "./antigravity.ts";

const FAKE_ACP = join(dirname(fileURLToPath(import.meta.url)), "..", "testing", "fake-acp-cli.ts");
const FAKE_AGY = join(dirname(fileURLToPath(import.meta.url)), "..", "testing", "fake-agy-cli.ts");
import { recordEvents } from "../testing/events.ts";
import { ensureHermesInjectProvider } from "./acp/hermes.ts";
import {
  applyClaudeInject,
  applyOpenAIInject,
  codexLocalProviderArgs,
  decodeInjectId,
  encodeInjectId,
  contextWindowsFromPs,
  loadedIdsFromPayloads,
  LOCAL_HOSTS,
  mergeLocalInject,
  resolveInjectId,
} from "./local-inject.ts";

const scratchDirs: string[] = [];

afterEach(() => {
  for (const dir of scratchDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("inject ids", () => {
  it("round-trips a host and API id", () => {
    expect(decodeInjectId(encodeInjectId("omlx", "GLM-5.2-fp8"))).toEqual({
      host: "omlx",
      model: "GLM-5.2-fp8",
    });
  });

  it("rejects official cloud slugs", () => {
    expect(decodeInjectId("claude-sonnet-5")).toBeNull();
    expect(decodeInjectId("gpt-5.6-sol")).toBeNull();
  });
});

describe("contextWindowsFromPs", () => {
  it("reads Ollama's per-model context_length from /api/ps, keyed by full and base id", () => {
    const windows = contextWindowsFromPs({
      models: [
        { name: "qwen3:8b", model: "qwen3:8b", context_length: 40960 },
        { name: "llama3.2:1b", model: "llama3.2:1b", context_length: 8192 },
        { name: "llama3.2:70b", model: "llama3.2:70b", context_length: 131072 },
        { name: "no-ctx:1b", model: "no-ctx:1b" },
        { name: "bad:1b", model: "bad:1b", context_length: -1 },
      ],
    });
    expect(windows.get("qwen3:8b")).toBe(40960);
    expect(windows.get("qwen3")).toBe(40960);
    expect(windows.get("llama3.2:1b")).toBe(8192);
    expect(windows.get("llama3.2:70b")).toBe(131072);
    expect(windows.get("llama3.2")).toBe(8192);
    expect(windows.has("no-ctx:1b")).toBe(false);
    expect(windows.has("bad:1b")).toBe(false);
  });
  it("tolerates payloads that are not a ps listing", () => {
    expect(contextWindowsFromPs(null).size).toBe(0);
    expect(contextWindowsFromPs({ data: [] }).size).toBe(0);
  });
});

describe("resolveInjectId", () => {
  it("keeps an already-encoded inject id", () => {
    expect(resolveInjectId("unsloth::orcarouter/Qwen3.8-27B-Uncensored-GGUF", [])).toBe(
      "unsloth::orcarouter/Qwen3.8-27B-Uncensored-GGUF",
    );
  });

  it("maps a leftover API id onto the live host:: row", () => {
    expect(
      resolveInjectId("orcarouter/Qwen3.8-27B-Uncensored-GGUF", [
        {
          id: "unsloth::orcarouter/Qwen3.8-27B-Uncensored-GGUF",
          host: "unsloth",
          model: "orcarouter/Qwen3.8-27B-Uncensored-GGUF",
          label: "orcarouter/Qwen3.8-27B-Uncensored-GGUF (Unsloth)",
        },
      ]),
    ).toBe("unsloth::orcarouter/Qwen3.8-27B-Uncensored-GGUF");
  });

  it("prefers a loaded host when several serve the same API id", () => {
    expect(
      resolveInjectId("GLM-5.2-fp8", [
        { id: "omlx::GLM-5.2-fp8", host: "omlx", model: "GLM-5.2-fp8", label: "GLM-5.2-fp8 (oMLX)" },
        { id: "lmstudio::GLM-5.2-fp8", host: "lmstudio", model: "GLM-5.2-fp8", label: "GLM-5.2-fp8 (LM Studio)", loaded: true },
      ]),
    ).toBe("lmstudio::GLM-5.2-fp8");
  });
});

describe("loadedIdsFromPayloads", () => {
  const omlx = LOCAL_HOSTS.find((host) => host.id === "omlx")!;
  const ollama = LOCAL_HOSTS.find((host) => host.id === "ollama")!;
  const lmstudio = LOCAL_HOSTS.find((host) => host.id === "lmstudio")!;

  it("uses oMLX /health default_model when no per-model loaded flags exist", () => {
    const loaded = loadedIdsFromPayloads(
      omlx,
      { data: [{ id: "gemma-4-31b-it-bf16" }, { id: "GLM-5.2-fp8" }] },
      { default_model: "gemma-4-31b-it-bf16", engine_pool: { loaded_count: 1 } },
    );
    expect([...loaded]).toEqual(["gemma-4-31b-it-bf16"]);
  });

  it("pins every oMLX /v1/models/status loaded row, not the default_model", () => {
    const loaded = loadedIdsFromPayloads(
      omlx,
      {
        data: [
          { id: "Qwen3.8-27B-Abliterated-MLX-BF16" },
          { id: "gemma-4-31b-it-bf16" },
          { id: "GLM-5.2-fp8" },
        ],
      },
      {
        default_model: "Qwen3.8-27B-Abliterated-MLX-BF16",
        loaded_count: 2,
        models: [
          { id: "Qwen3.8-27B-Abliterated-MLX-BF16", loaded: false },
          { id: "gemma-4-31b-it-bf16", loaded: true },
          { id: "GLM-5.2-fp8", loaded: true },
        ],
      },
    );
    expect([...loaded].sort()).toEqual(["GLM-5.2-fp8", "gemma-4-31b-it-bf16"]);
  });

  it("uses Ollama /api/ps running models", () => {
    const loaded = loadedIdsFromPayloads(
      ollama,
      { data: [{ id: "llama3.2:latest" }, { id: "mistral:latest" }] },
      { models: [{ name: "llama3.2:latest", size: 1 }] },
    );
    expect([...loaded]).toEqual(["llama3.2:latest"]);
  });

  it("pins the catalog id when /api/ps reports a tagged name", () => {
    const loaded = loadedIdsFromPayloads(
      ollama,
      { data: [{ id: "llama3.2" }, { id: "mistral" }] },
      { models: [{ name: "llama3.2:latest", size: 1 }] },
    );
    expect(loaded.has("llama3.2")).toBe(true);
    expect(loaded.has("llama3.2:latest")).toBe(true);
  });

  it("uses LM Studio state=loaded and skips not-loaded", () => {
    const loaded = loadedIdsFromPayloads(
      lmstudio,
      { data: [{ id: "qwen" }, { id: "other" }] },
      { data: [{ id: "qwen", state: "loaded" }, { id: "other", state: "not-loaded" }] },
    );
    expect([...loaded]).toEqual(["qwen"]);
  });

  it("does not pin a default_model that is not in the catalog", () => {
    const loaded = loadedIdsFromPayloads(
      omlx,
      { data: [{ id: "gemma-4-31b-it-bf16" }] },
      { default_model: "someone-elses-model" },
    );
    expect(loaded.size).toBe(0);
  });
});

describe("mergeLocalInject", () => {
  it("marks oMLX /v1/models/status loaded rows, not the default_model", async () => {
    const catalog = await mergeLocalInject(
      { default: "keep", options: [{ id: "keep", label: "Keep" }] },
      { VITEST: "true", OPENFOLKS_PROBE_LOCAL_INJECT: "1" },
      async (url) => {
        const href = String(url);
        if (href.includes("/v1/models/status")) {
          return new Response(
            JSON.stringify({
              default_model: "Qwen3.8-27B-Abliterated-MLX-BF16",
              models: [
                { id: "Qwen3.8-27B-Abliterated-MLX-BF16", loaded: false },
                { id: "gemma-4-31b-it-bf16", loaded: true },
                { id: "GLM-5.2-fp8", loaded: true },
              ],
            }),
            { status: 200 },
          );
        }
        if (href.includes(":8080/v1/models")) {
          return new Response(
            JSON.stringify({
              data: [
                { id: "Qwen3.8-27B-Abliterated-MLX-BF16" },
                { id: "gemma-4-31b-it-bf16" },
                { id: "GLM-5.2-fp8" },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response("nope", { status: 500 });
      },
    );
    expect(catalog.options.find((option) => option.id === "omlx::gemma-4-31b-it-bf16")).toMatchObject({
      custom: true,
      loaded: true,
    });
    expect(catalog.options.find((option) => option.id === "omlx::GLM-5.2-fp8")).toMatchObject({
      custom: true,
      loaded: true,
    });
    expect(catalog.options.find((option) => option.id === "omlx::Qwen3.8-27B-Abliterated-MLX-BF16")?.loaded).toBeUndefined();
  });

  it("appends live host models as custom without touching official rows", async () => {
    const catalog = await mergeLocalInject(
      { default: "claude-sonnet-5", options: [{ id: "claude-sonnet-5", label: "Claude Sonnet 5" }] },
      { VITEST: "true", OPENFOLKS_PROBE_LOCAL_INJECT: "1" },
      async (url) => {
        if (String(url).includes(":8080")) {
          return new Response(JSON.stringify({ data: [{ id: "GLM-5.2-fp8" }, { id: "nomic-embed" }] }), { status: 200 });
        }
        return new Response("nope", { status: 500 });
      },
    );
    expect(catalog.options[0]).toEqual({ id: "claude-sonnet-5", label: "Claude Sonnet 5" });
    expect(catalog.options.some((option) => option.id === "omlx::GLM-5.2-fp8" && option.custom)).toBe(true);
    expect(catalog.options.some((option) => option.id.includes("nomic"))).toBe(false);
  });

  it("drops a leftover custom API id that a live inject already covers", async () => {
    const catalog = await mergeLocalInject(
      {
        default: "claude-sonnet-5",
        options: [
          { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
          { id: "orcarouter/Qwen3.8-27B-Uncensored-GGUF", label: "orcarouter/Qwen3.8-27B-Uncensored-GGUF", custom: true },
        ],
      },
      { VITEST: "true", OPENFOLKS_PROBE_LOCAL_INJECT: "1" },
      async (url) => {
        if (String(url).includes(":8888")) {
          return new Response(JSON.stringify({ data: [{ id: "orcarouter/Qwen3.8-27B-Uncensored-GGUF" }] }), { status: 200 });
        }
        return new Response("nope", { status: 500 });
      },
    );
    expect(catalog.options.some((option) => option.id === "orcarouter/Qwen3.8-27B-Uncensored-GGUF")).toBe(false);
    expect(catalog.options.some((option) => option.id === "unsloth::orcarouter/Qwen3.8-27B-Uncensored-GGUF" && option.custom)).toBe(
      true,
    );
  });
});

describe("applyOpenAIInject", () => {
  it("points an OpenAI-compatible CLI at the local host", () => {
    const env: Record<string, string | undefined> = {};
    const applied = applyOpenAIInject(env, "omlx::MiniMax-M3-4bit");
    expect(applied).toEqual({ model: "MiniMax-M3-4bit", injected: true });
    expect(env.OPENAI_BASE_URL).toBe("http://127.0.0.1:8080/v1");
    expect(env.OPENAI_API_KEY).toBe("omlx");
  });
});

describe("applyClaudeInject", () => {
  it("points Claude at the local host instead of Anthropic", () => {
    const env: Record<string, string | undefined> = {};
    const applied = applyClaudeInject(env, "omlx::MiniMax-M3-4bit");
    expect(applied).toEqual({ model: "MiniMax-M3-4bit", injected: true });
    expect(env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:8080");
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("omlx");
    expect(env.ANTHROPIC_MODEL).toBe("MiniMax-M3-4bit");
  });
});

describe("codexLocalProviderArgs", () => {
  it("configures custom providers through env keys without putting credentials on argv", () => {
    const env: Record<string, string | undefined> = { UNSLOTH_STUDIO_AUTH_TOKEN: "unsloth-secret" };
    const args = codexLocalProviderArgs(env, "unsloth::local-model");
    const rendered = JSON.stringify(args);
    expect(rendered).toContain("model_providers.unsloth.base_url");
    expect(rendered).toContain("OPENFOLKS_LOCAL_UNSLOTH_API_KEY");
    expect(rendered).not.toContain("unsloth-secret");
    expect(rendered).not.toContain("model_providers.ollama.base_url");
    expect(rendered).not.toContain("model_providers.lmstudio.base_url");
    expect(env.OPENFOLKS_LOCAL_UNSLOTH_API_KEY).toBe("unsloth-secret");
  });
});

describe("ensureGrokInjectSlug", () => {
  it("writes a config block the first time and reuses it after", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-grok-inject-"));
    scratchDirs.push(home);
    mkdirSync(join(home, ".grok"), { recursive: true });
    writeFileSync(join(home, ".grok", "config.toml"), "[cli]\nchannel = \"alpha\"\n");
    const first = ensureGrokInjectSlug("omlx::GLM-5.2-fp8", { HOME: home });
    const again = ensureGrokInjectSlug("omlx::GLM-5.2-fp8", { HOME: home });
    expect(first).toBe(again);
    const text = readFileSync(join(home, ".grok", "config.toml"), "utf8");
    expect(text).toContain(`model = "GLM-5.2-fp8"`);
    expect(text).toContain(`base_url = "http://127.0.0.1:8080/v1"`);
  });

  it("writes the resolved Unsloth credential instead of a placeholder", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-grok-unsloth-"));
    scratchDirs.push(home);
    mkdirSync(join(home, ".grok"), { recursive: true });
    ensureGrokInjectSlug("unsloth::local-model", {
      HOME: home,
      UNSLOTH_STUDIO_AUTH_TOKEN: "unsloth-secret",
    });
    const text = readFileSync(join(home, ".grok", "config.toml"), "utf8");
    expect(text).toContain(`api_key = "unsloth-secret"`);
  });

  it("puts the resolved oMLX slug after agent on the Grok child argv", async () => {
    const home = mkdtempSync(join(tmpdir(), "omb-grok-argv-"));
    scratchDirs.push(home);
    mkdirSync(join(home, ".grok"), { recursive: true });
    const dump = join(home, "dump.json");
    const instance = await GrokAgentDriver.create({
      instanceId: "grok-omlx-argv",
      displayName: "Grok",
      environment: { HOME: home, FAKE_ACP_DUMP: dump },
      enabled: true,
      config: { cli: FAKE_ACP, fullAuto: false },
    });
    const recorder = recordEvents(instance.adapter);
    try {
      await instance.adapter.sendTurn({
        threadId: "t-omlx",
        text: "hi",
        model: "omlx::GLM-5.2-fp8",
      });
      await recorder.until((e) => e.type === "turn.completed");
      const argv = JSON.parse(readFileSync(dump, "utf8")).argv as string[];
      const agent = argv.indexOf("agent");
      const modelFlag = argv.indexOf("-m");
      expect(agent).toBeGreaterThan(-1);
      expect(modelFlag).toBeGreaterThan(agent);
      expect(argv.indexOf("stdio")).toBeGreaterThan(modelFlag);
      expect(argv[modelFlag + 1]).toBe("omlx-glm-5.2-fp8");
      const configCalls = JSON.parse(readFileSync(`${dump}.config.json`, "utf8")) as Array<{
        method: string;
        params: { modelId?: string };
      }>;
      expect(configCalls).toContainEqual({
        method: "session/set_model",
        params: { sessionId: "fake-acp-session", modelId: "omlx-glm-5.2-fp8" },
      });
      expect(readFileSync(join(home, ".grok", "config.toml"), "utf8")).toContain(`model = "GLM-5.2-fp8"`);
    } finally {
      await instance.dispose();
    }
  });
});


describe("ensureOpenCodeInjectModel", () => {
  it("merges a host provider into opencode.json without dropping existing models", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-opencode-inject-"));
    scratchDirs.push(home);
    const dir = join(home, ".config", "opencode");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "opencode.json"),
      JSON.stringify({
        provider: {
          omlx: {
            npm: "@ai-sdk/openai-compatible",
            name: "oMLX",
            options: { baseURL: "http://127.0.0.1:8080/v1" },
            models: { "already-there": { name: "Keep me" } },
          },
        },
      }),
    );
    const native = ensureOpenCodeInjectModel("omlx::GLM-5.2-fp8", { HOME: home });
    expect(native).toBe("omlx/GLM-5.2-fp8");
    const config = JSON.parse(readFileSync(join(dir, "opencode.json"), "utf8")) as {
      provider: { omlx: { models: Record<string, { name: string }>; options: { baseURL: string } } };
    };
    expect(config.provider.omlx.models["already-there"]).toEqual({ name: "Keep me" });
    expect(config.provider.omlx.models["GLM-5.2-fp8"]).toBeTruthy();
    expect(config.provider.omlx.options.baseURL).toBe("http://127.0.0.1:8080/v1");
  });

  it("injects into a default object when opencode.json is malformed", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-opencode-bad-json-"));
    scratchDirs.push(home);
    const dir = join(home, ".config", "opencode");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "opencode.json"), "{not-json");
    expect(ensureOpenCodeInjectModel("omlx::GLM-5.2-fp8", { HOME: home })).toBe("omlx/GLM-5.2-fp8");
    const config = JSON.parse(readFileSync(join(dir, "opencode.json"), "utf8")) as {
      provider: { omlx: { models: Record<string, unknown> } };
    };
    expect(config.provider.omlx.models["GLM-5.2-fp8"]).toBeTruthy();
  });
});

describe("ensureHermesInjectProvider", () => {
  it("writes a named custom provider and returns the ACP model id", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-hermes-inject-"));
    scratchDirs.push(home);
    mkdirSync(join(home, ".hermes"), { recursive: true });
    writeFileSync(join(home, ".hermes", "config.yaml"), "model:\n  provider: auto\n  base_url: https://openrouter.ai/api/v1\n");
    const native = ensureHermesInjectProvider("omlx::gemma-4-31b-it-bf16", { HOME: home });
    expect(native).toBe("custom:omlx:gemma-4-31b-it-bf16");
    const again = ensureHermesInjectProvider("omlx::gemma-4-31b-it-bf16", { HOME: home });
    expect(again).toBe(native);
    const text = readFileSync(join(home, ".hermes", "config.yaml"), "utf8");
    expect(text).toContain("provider: auto");
    expect(text).toContain("https://openrouter.ai/api/v1");
    expect(text.match(/^  omlx:$/gm)?.length).toBe(1);
    expect(text).toContain("base_url: http://127.0.0.1:8080/v1");
    expect(text).toContain("api_key: omlx");
  });

  it("replaces a nested provider block without leaving orphan YAML lines", () => {
    const home = mkdtempSync(join(tmpdir(), "omb-hermes-nested-"));
    scratchDirs.push(home);
    mkdirSync(join(home, ".hermes"), { recursive: true });
    writeFileSync(
      join(home, ".hermes", "config.yaml"),
      [
        "providers:",
        "  omlx:",
        "    base_url: http://old",
        "    extras:",
        "      nested: keep-sibling-not-this",
        "    api_key: old",
        "  other:",
        "    base_url: http://other",
        "",
      ].join("\n"),
    );
    ensureHermesInjectProvider("omlx::gemma-4-31b-it-bf16", { HOME: home });
    const text = readFileSync(join(home, ".hermes", "config.yaml"), "utf8");
    expect(text).toContain("  other:\n    base_url: http://other");
    expect(text).toContain("base_url: http://127.0.0.1:8080/v1");
    expect(text).not.toContain("nested: keep-sibling-not-this");
    expect(text).not.toContain("http://old");
    expect(text.match(/^  omlx:$/gm)?.length).toBe(1);
  });
});


describe("live Custom lists on every local CLI harness", () => {
  it("merges probed host models onto Antigravity", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL) => {
      if (String(url).includes(":8080")) {
        return new Response(JSON.stringify({ data: [{ id: "GLM-5.2-fp8" }] }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    }) as typeof fetch;
    const home = mkdtempSync(join(tmpdir(), "omb-all-inject-"));
    scratchDirs.push(home);
    const environment = { HOME: home, OPENFOLKS_PROBE_LOCAL_INJECT: "1" };
    const instance = await AntigravityDriver.create({
      instanceId: "agy",
      displayName: "Antigravity",
      environment,
      enabled: true,
      config: { cli: FAKE_AGY, fullAuto: true },
    });
    try {
      expect(instance.models.options.some((option) => option.id === "omlx::GLM-5.2-fp8" && option.custom)).toBe(true);
    } finally {
      globalThis.fetch = previous;
      await instance.dispose();
    }
  });
});
