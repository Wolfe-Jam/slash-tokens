export interface ModelInfo {
  input: number;    // $/M input tokens (base/short-context rate)
  output: number;   // $/M output tokens (base/short-context rate)
  context: number;  // max context window
  // Optional long-context pricing tier. xAI (and Gemini 3.1 Pro) bill the
  // WHOLE request at a higher rate once the prompt exceeds this threshold.
  longContextThreshold?: number;
  longContextInput?: number;
  longContextOutput?: number;
}

const OPUS = { input: 5.00, output: 25.00, context: 1_000_000 };
const SONNET = { input: 2.00, output: 10.00, context: 1_000_000 };
const HAIKU = { input: 1.00, output: 5.00, context: 200_000 };
const GROK_46 = {
  input: 2.00, output: 6.00, context: 500_000,
  longContextThreshold: 200_000, longContextInput: 4.00, longContextOutput: 12.00,
};
const GROK_43 = {
  input: 1.25, output: 2.50, context: 1_000_000,
  longContextThreshold: 200_000, longContextInput: 2.50, longContextOutput: 5.00,
};
const GEMINI_PRO = {
  input: 2.00, output: 12.00, context: 1_000_000,
  longContextThreshold: 200_000, longContextInput: 4.00, longContextOutput: 18.00,
};
const GEMINI_FLASH = { input: 0.30, output: 2.50, context: 1_000_000 };
const GPT_SOL = { input: 4.00, output: 20.00, context: 1_050_000 };
const GPT_TERRA = { input: 2.00, output: 12.00, context: 1_050_000 };
const GPT_LUNA = { input: 0.20, output: 1.20, context: 1_050_000 };
const GPT_54 = { input: 2.50, output: 15.00, context: 1_000_000 };
const GPT_54_MINI = { input: 0.75, output: 4.50, context: 128_000 };
const GPT_54_NANO = { input: 0.20, output: 1.25, context: 128_000 };

// Pricing as of 2026-08-25 — USD per million tokens.
// First-party: platform.claude.com/docs/en/about-claude/pricing
//              developers.openai.com/api/docs/models
//              docs.x.ai/developers/models
//              ai.google.dev/gemini-api/docs/pricing
// Old keys stay as aliases so existing call sites don't throw.
export const MODELS: Record<string, ModelInfo> = {
  // Anthropic — live names + generic aliases (same rates)
  'claude-opus-5':     { ...OPUS },
  'claude-opus':       { ...OPUS },
  'claude-opus-4.7':   { ...OPUS },
  'claude-sonnet-5':   { ...SONNET },
  'claude-sonnet':     { ...SONNET },
  'claude-haiku-4.5':  { ...HAIKU },
  'claude-haiku':      { ...HAIKU },
  // xAI — flagship 4.6, cheap same-provider 4.3. 4.20 / fast are aliases.
  'grok-4.6':          { ...GROK_46 },
  'grok-4.3':          { ...GROK_43 },
  'grok-4.20':         { ...GROK_43 },
  'grok-4-1-fast':     { ...GROK_43 },
  // Google
  'gemini-3.1-pro':         { ...GEMINI_PRO },
  'gemini-3.5-flash-lite':  { ...GEMINI_FLASH },
  'gemini-2.5-flash':       { ...GEMINI_FLASH },
  // OpenAI — live 5.6 ladder. 5.4 family kept as aliases (old prices).
  'gpt-5.6-sol':       { ...GPT_SOL },
  'gpt-5.6-terra':     { ...GPT_TERRA },
  'gpt-5.6-luna':      { ...GPT_LUNA },
  'gpt-5.4':           { ...GPT_54 },
  'gpt-5.4-mini':      { ...GPT_54_MINI },
  'gpt-5.4-nano':      { ...GPT_54_NANO },
};

export function getModel(name: string): ModelInfo | undefined {
  return MODELS[name] || MODELS[name.toLowerCase()];
}

export function effectiveRate(tokens: number, info: ModelInfo): { input: number; output: number } {
  if (info.longContextThreshold !== undefined && tokens > info.longContextThreshold) {
    return {
      input: info.longContextInput ?? info.input,
      output: info.longContextOutput ?? info.output,
    };
  }
  return { input: info.input, output: info.output };
}

export function listModels(): string[] {
  return Object.keys(MODELS);
}
