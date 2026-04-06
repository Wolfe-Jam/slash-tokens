export interface ModelInfo {
  input: number;    // $/M input tokens
  output: number;   // $/M output tokens
  context: number;  // max context window
}

export const MODELS: Record<string, ModelInfo> = {
  // Anthropic
  'claude-opus':     { input: 15.00, output: 75.00, context: 200000 },
  'claude-sonnet':   { input:  3.00, output: 15.00, context: 200000 },
  'claude-haiku':    { input:  0.25, output:  1.25, context: 200000 },
  // xAI
  'grok-3':          { input:  5.00, output: 15.00, context: 131072 },
  'grok-3-mini':     { input:  0.30, output:  0.50, context: 131072 },
  // Google
  'gemini-2.0-flash':{ input:  0.10, output:  0.40, context: 1048576 },
  'gemini-2.0-pro':  { input:  1.25, output:  5.00, context: 1048576 },
  // OpenAI
  'gpt-4o':          { input:  2.50, output: 10.00, context: 128000 },
  'gpt-4o-mini':     { input:  0.15, output:  0.60, context: 128000 },
  'gpt-4.1':         { input:  2.00, output:  8.00, context: 1047576 },
  'gpt-4.1-mini':    { input:  0.40, output:  1.60, context: 1047576 },
  'gpt-4.1-nano':    { input:  0.10, output:  0.40, context: 1047576 },
};

export function getModel(name: string): ModelInfo | undefined {
  return MODELS[name] || MODELS[name.toLowerCase()];
}

export function listModels(): string[] {
  return Object.keys(MODELS);
}
