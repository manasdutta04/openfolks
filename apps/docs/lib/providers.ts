/**
 * Providers shown in the website's model picker. The app lists the engines it
 * finds on your machine; model names here are examples, not a promise of what
 * each provider currently offers.
 */
export interface ModelProvider {
  id: string;
  name: string;
  group: 'Cloud' | 'Local';
  status: string;
  blurb: string;
  models: { name: string; default?: boolean }[];
}

export const PROVIDERS: ModelProvider[] = [
  {
    id: 'claude', name: 'Claude', group: 'Cloud', 
    status: 'Uses your Claude sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'Claude Sonnet 5', default: true }, { name: 'Claude Fable 5' }, { name: 'Claude Opus 5' }, { name: 'Claude Haiku 4.5' }],
  },
  {
    id: 'chatgpt', name: 'ChatGPT', group: 'Cloud', 
    status: 'Uses your Codex sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'GPT-5 Codex', default: true }, { name: 'GPT-5' }, { name: 'GPT-5 mini' }],
  },
  {
    id: 'openrouter', name: 'OpenRouter', group: 'Cloud', 
    status: 'Uses your API key', blurb: 'Any model available to your OpenRouter account.',
    models: [
      { name: 'anthropic/claude-sonnet', default: true },
      { name: 'deepseek/deepseek-chat' },
      { name: 'meta-llama/llama-3.3-70b-instruct' },
      { name: 'qwen/qwen-2.5-coder-32b-instruct' },
    ],
  },
  {
    id: 'ollama', name: 'Ollama', group: 'Local', 
    status: 'Runs on this computer', blurb: 'Models you have pulled with Ollama.',
    models: [{ name: 'llama3.2', default: true }, { name: 'qwen2.5-coder' }, { name: 'gemma3' }, { name: 'mistral' }],
  },
  {
    id: 'lmstudio', name: 'LM Studio', group: 'Local', 
    status: 'Runs on this computer', blurb: 'Models loaded in LM Studio.',
    models: [{ name: 'Loaded model', default: true }],
  },
];
