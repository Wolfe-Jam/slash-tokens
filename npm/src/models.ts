export interface ModelInfo {
  input: number;    // $/M input tokens
  output: number;   // $/M output tokens
  context: number;  // max context window
}

// Pricing as of April 2026 — USD per million tokens
export const MODELS: Record<string, ModelInfo> = {
  // Anthropic
  'claude-opus':     { input:  5.00, output: 25.00, context: 1000000 },
  'claude-sonnet':   { input:  3.00, output: 15.00, context: 1000000 },
  'claude-haiku':    { input:  1.00, output:  5.00, context: 200000 },
  // xAI
  'grok-4.20':       { input:  2.00, output:  6.00, context: 2000000 },
  'grok-4-1-fast':   { input:  0.20, output:  0.50, context: 2000000 },
  // Google
  'gemini-3.1-pro':  { input:  2.00, output: 12.00, context: 1000000 },
  'gemini-2.5-flash':{ input:  0.30, output:  2.50, context: 1000000 },
  // OpenAI
  'gpt-5.4':         { input:  2.50, output: 15.00, context: 1000000 },
  'gpt-5.4-mini':    { input:  0.75, output:  4.50, context: 128000 },
  'gpt-5.4-nano':    { input:  0.20, output:  1.25, context: 128000 },
};

export function getModel(name: string): ModelInfo | undefined {
  return MODELS[name] || MODELS[name.toLowerCase()];
}

export function listModels(): string[] {
  return Object.keys(MODELS);
}
