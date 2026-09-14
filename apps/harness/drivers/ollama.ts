// Local Ollama — OpenAI-compatible chat on localhost:11434.
import { defineLocalOpenAIDriver } from "./local-openai.ts";

const DEFAULT_URL = "http://127.0.0.1:11434/v1";

export const OllamaDriver = defineLocalOpenAIDriver({
  driverKind: "ollama",
  displayName: "Ollama",
  defaultUrl: DEFAULT_URL,
  apiKey: "ollama",
  envUrlKey: "OLLAMA_HOST",
  unavailableReason: "Ollama is not running — start it, or install from https://ollama.com",
  install: {
    docsUrl: "https://ollama.com",
    command: {
      darwin: "brew install ollama && ollama serve",
      linux: "curl -fsSL https://ollama.com/install.sh | sh && ollama serve",
      win32: "Install Ollama from https://ollama.com/download and open the app",
    },
    signInCommand: "ollama pull llama3.2",
  },
  loadedCatalogUrl: (apiUrl) => {
    try {
      const origin = new URL(apiUrl).origin;
      return `${origin}/api/ps`;
    } catch {
      return null;
    }
  },
});

export function decodeOllamaConfig(raw: unknown) {
  return OllamaDriver.decodeConfig(raw);
}
