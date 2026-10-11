/**
 * Providers shown in the website's model picker. The app lists the engines it
 * finds on your machine; model names here are examples, not a promise of what
 * each provider currently offers.
 */
export interface ModelProvider {
  id: string;
  name: string;
  group: 'Cloud' | 'Local';
  glyph: string;
  color: string;
  status: string;
  blurb: string;
  models: { name: string; default?: boolean }[];
}

export const PROVIDERS: ModelProvider[] = [
  {
    id: 'claude', name: 'Claude', group: 'Cloud', glyph: '✳', color: '#d97757',
    status: 'Uses your Claude sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'Claude Sonnet 5', default: true }, { name: 'Claude Fable 5' }, { name: 'Claude Opus 5' }, { name: 'Claude Haiku 4.5' }],
  },
  {
    id: 'chatgpt', name: 'ChatGPT', group: 'Cloud', glyph: '◎', color: '#e6e6ea',
    status: 'Uses your Codex sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'GPT-5 Codex', default: true }, { name: 'GPT-5' }, { name: 'GPT-5 mini' }],
  },
  {
    id: 'gemini', name: 'Gemini', group: 'Cloud', glyph: '✦', color: '#7fa6f0',
    status: 'Uses your Google sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'Gemini 2.5 Pro', default: true }, { name: 'Gemini 2.5 Flash' }],
  },
  {
    id: 'grok', name: 'Grok', group: 'Cloud', glyph: '⌀', color: '#e6e6ea',
    status: 'Uses your xAI sign-in', blurb: 'Choose a model for this folk.',
    models: [{ name: 'Grok 4', default: true }, { name: 'Grok Code Fast' }],
  },
  {
    id: 'openrouter', name: 'OpenRouter', group: 'Cloud', glyph: '⇄', color: '#8fa0ff',
    status: 'Uses your API key', blurb: 'Any model available to your OpenRouter account.',
    models: [
      { name: 'anthropic/claude-sonnet', default: true },
      { name: 'deepseek/deepseek-chat' },
      { name: 'meta-llama/llama-3.3-70b-instruct' },
      { name: 'qwen/qwen-2.5-coder-32b-instruct' },
    ],
  },
  {
    id: 'ollama', name: 'Ollama', group: 'Local', glyph: '◐', color: '#e6e6ea',
    status: 'Runs on this computer', blurb: 'Models you have pulled with Ollama.',
    models: [{ name: 'llama3.2', default: true }, { name: 'qwen2.5-coder' }, { name: 'gemma3' }, { name: 'mistral' }],
  },
  {
    id: 'lmstudio', name: 'LM Studio', group: 'Local', glyph: '▤', color: '#a58cf0',
    status: 'Runs on this computer', blurb: 'Models loaded in LM Studio.',
    models: [{ name: 'Loaded model', default: true }],
  },
  {
    id: 'custom', name: 'Custom API', group: 'Local', glyph: '{ }', color: '#4ec99a',
    status: 'Any OpenAI-compatible endpoint', blurb: 'Point the folk at your own server.',
    models: [{ name: 'Your endpoint', default: true }],
  },
];
