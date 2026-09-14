import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decodeLocalOpenAIConfig, normalizeLocalApiUrl, probeLocalModels } from "./local-openai.ts";
import { OllamaDriver } from "./ollama.ts";
import { LmStudioDriver } from "./lmstudio.ts";

describe("local OpenAI helpers", () => {
  it("normalizes URLs to end with /v1", () => {
    expect(normalizeLocalApiUrl("http://127.0.0.1:11434")).toBe("http://127.0.0.1:11434/v1");
    expect(normalizeLocalApiUrl("http://127.0.0.1:11434/v1/")).toBe("http://127.0.0.1:11434/v1");
    expect(normalizeLocalApiUrl("0.0.0.0:11434")).toBe("http://0.0.0.0:11434/v1");
  });

  it("decodes default and env override URLs", () => {
    expect(decodeLocalOpenAIConfig({}, "http://127.0.0.1:11434/v1").url).toBe("http://127.0.0.1:11434/v1");
    const saved = process.env.OLLAMA_HOST;
    process.env.OLLAMA_HOST = "http://10.0.0.2:11434";
    try {
      expect(decodeLocalOpenAIConfig({}, "http://127.0.0.1:11434/v1", "OLLAMA_HOST").url).toBe(
        "http://10.0.0.2:11434/v1",
      );
    } finally {
      if (saved === undefined) delete process.env.OLLAMA_HOST;
      else process.env.OLLAMA_HOST = saved;
    }
  });

  it("probes catalogs and marks reachability", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ data: [{ id: "llama3.2", name: "Llama 3.2" }] }), { status: 200 }),
    );
    const probed = await probeLocalModels("http://127.0.0.1:11434/v1", "ollama", null, fetchImpl as typeof fetch);
    expect(probed.reachable).toBe(true);
    expect(probed.catalog).toEqual({
      default: "llama3.2",
      options: [{ id: "llama3.2", label: "Llama 3.2", custom: true }],
    });
  });

  it("reports unreachable when the host is down", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const probed = await probeLocalModels("http://127.0.0.1:11434/v1", "ollama", null, fetchImpl as typeof fetch);
    expect(probed.reachable).toBe(false);
    expect(probed.catalog.options).toEqual([]);
  });
});

describe("OllamaDriver", () => {
  const savedHost = process.env.OLLAMA_HOST;

  beforeEach(() => {
    delete process.env.OLLAMA_HOST;
  });

  afterEach(() => {
    if (savedHost === undefined) delete process.env.OLLAMA_HOST;
    else process.env.OLLAMA_HOST = savedHost;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers as a custom local engine", () => {
    expect(OllamaDriver.driverKind).toBe("ollama");
    expect(OllamaDriver.metadata.access).toBe("custom");
    expect(OllamaDriver.defaultConfig().url).toBe("http://127.0.0.1:11434/v1");
  });

  it("is unavailable when Ollama is not running", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const inst = await OllamaDriver.create({
      instanceId: "ollama-1",
      displayName: "Ollama",
      enabled: true,
      config: OllamaDriver.defaultConfig(),
      environment: {},
    });
    const snap = await inst.snapshot();
    expect(snap.state).toBe("unavailable");
    expect(snap.reason).toMatch(/Ollama is not running/);
    await inst.dispose();
  });

  it("lists models when the daemon responds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/api/ps")) {
          return new Response(JSON.stringify({ models: [{ name: "llama3.2", model: "llama3.2" }] }), {
            status: 200,
          });
        }
        return new Response(
          JSON.stringify({ data: [{ id: "llama3.2" }, { id: "mistral" }] }),
          { status: 200 },
        );
      }),
    );
    const inst = await OllamaDriver.create({
      instanceId: "ollama-2",
      displayName: "Ollama",
      enabled: true,
      config: OllamaDriver.defaultConfig(),
      environment: {},
    });
    await inst.refreshModels?.();
    expect(await inst.snapshot()).toMatchObject({ state: "available" });
    expect(inst.models.options.map((row) => row.id)).toEqual(["llama3.2", "mistral"]);
    expect(inst.models.options.every((row) => row.custom)).toBe(true);
    await inst.dispose();
  });
});

describe("LmStudioDriver", () => {
  beforeEach(() => {
    delete process.env.LM_STUDIO_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers as a custom local engine on port 1234", () => {
    expect(LmStudioDriver.driverKind).toBe("lmstudio");
    expect(LmStudioDriver.metadata.access).toBe("custom");
    expect(LmStudioDriver.defaultConfig().url).toBe("http://127.0.0.1:1234/v1");
  });

  it("is unavailable when LM Studio is not running", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const inst = await LmStudioDriver.create({
      instanceId: "lms-1",
      displayName: "LM Studio",
      enabled: true,
      config: LmStudioDriver.defaultConfig(),
      environment: {},
    });
    const snap = await inst.snapshot();
    expect(snap.state).toBe("unavailable");
    expect(snap.reason).toMatch(/LM Studio is not running/);
    await inst.dispose();
  });

  it("lists models when the local server responds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes("/api/v0/models")) {
          return new Response(
            JSON.stringify({ data: [{ id: "local-model", state: "loaded" }] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: [{ id: "local-model" }] }), { status: 200 });
      }),
    );
    const inst = await LmStudioDriver.create({
      instanceId: "lms-2",
      displayName: "LM Studio",
      enabled: true,
      config: LmStudioDriver.defaultConfig(),
      environment: {},
    });
    await inst.refreshModels?.();
    expect(await inst.snapshot()).toMatchObject({ state: "available" });
    expect(inst.models.options).toEqual([
      expect.objectContaining({ id: "local-model", custom: true, loaded: true }),
    ]);
    await inst.dispose();
  });
});
