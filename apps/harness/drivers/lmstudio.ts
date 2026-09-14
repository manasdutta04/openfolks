// Local LM Studio — OpenAI-compatible server on localhost:1234.
import { defineLocalOpenAIDriver } from "./local-openai.ts";

const DEFAULT_URL = "http://127.0.0.1:1234/v1";

export const LmStudioDriver = defineLocalOpenAIDriver({
  driverKind: "lmstudio",
  displayName: "LM Studio",
  defaultUrl: DEFAULT_URL,
  apiKey: "lm-studio",
  envUrlKey: "LM_STUDIO_URL",
  unavailableReason: "LM Studio is not running — start the local server in LM Studio (port 1234)",
  install: {
    docsUrl: "https://lmstudio.ai",
    command: {
      darwin: "Install LM Studio from https://lmstudio.ai and start the local server",
      linux: "Install LM Studio from https://lmstudio.ai and start the local server",
      win32: "Install LM Studio from https://lmstudio.ai and start the local server",
    },
    signInCommand: "Load a model in LM Studio, then start the local server",
  },
  loadedCatalogUrl: (apiUrl) => {
    try {
      const origin = new URL(apiUrl).origin;
      return `${origin}/api/v0/models`;
    } catch {
      return null;
    }
  },
});

export function decodeLmStudioConfig(raw: unknown) {
  return LmStudioDriver.decodeConfig(raw);
}
