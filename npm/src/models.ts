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
const OPUS_55 = { input: 4.00, output: 20.00, context: 1_000_000 };
const FABLE = { input: 10.00, output: 50.00, context: 1_000_000 };
const SONNET_4X = { input: 3.00, output: 15.00, context: 1_000_000 };
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
// Gemini 3.6–3.8 Flash: launch price through 2026-12-31; Google lists $1.50/$7.50
// from 2027-01-01. Update this entry before then.
const GEMINI_FLASH_3X = { input: 0.75, output: 3.75, context: 1_000_000 };
const GEMINI_35_FLASH = { input: 1.50, output: 9.00, context: 1_000_000 };
const GEMINI_31_FLASH_LITE = { input: 0.25, output: 1.50, context: 1_000_000 };
const GROK_BUILD = {
  input: 1.00, output: 2.00, context: 256_000,
  longContextThreshold: 200_000, longContextInput: 2.00, longContextOutput: 4.00,
};
const GPT_6_ASTRA = { input: 10.00, output: 50.00, context: 1_050_000 };
const GPT_6_SOL = { input: 2.00, output: 10.00, context: 1_050_000 };
const GPT_6_LUNA = { input: 0.10, output: 0.50, context: 1_050_000 };
const GPT_SOL = { input: 4.00, output: 20.00, context: 1_050_000 };
const GPT_TERRA = { input: 2.00, output: 12.00, context: 1_050_000 };
const GPT_LUNA = { input: 0.20, output: 1.20, context: 1_050_000 };
const GPT_54 = { input: 2.50, output: 15.00, context: 1_000_000 };
const GPT_54_MINI = { input: 0.75, output: 4.50, context: 128_000 };
const GPT_54_NANO = { input: 0.20, output: 1.25, context: 128_000 };

// Pricing as of 2026-10-07 — USD per million tokens (checked against the four pages below).
// First-party: platform.claude.com/docs/en/about-claude/pricing
//              developers.openai.com/api/docs/models
//              docs.x.ai/developers/models
//              ai.google.dev/gemini-api/docs/pricing
// Old keys stay as aliases so existing call sites don't throw.
export const MODELS: Record<string, ModelInfo> = {
  // Anthropic — live names + generic aliases (same rates)
  'claude-fable-5.1':  { ...FABLE },
  'claude-fable-5':    { ...FABLE },
  'claude-mythos-5.1': { ...FABLE },
  'claude-mythos-5':   { ...FABLE },
  'claude-opus-5.5':   { ...OPUS_55 },
  'claude-opus-5':     { ...OPUS },
  'claude-opus-4.8':   { ...OPUS },
  'claude-opus':       { ...OPUS },
  'claude-opus-4.7':   { ...OPUS },
  'claude-opus-4.6':   { ...OPUS },
  'claude-opus-4.5':   { ...OPUS },
  'claude-sonnet-5.5': { ...SONNET },
  'claude-sonnet-5':   { ...SONNET },
  'claude-sonnet':     { ...SONNET },
  'claude-sonnet-4.6': { ...SONNET_4X },
  'claude-sonnet-4.5': { ...SONNET_4X },
  'claude-haiku-4.5':  { ...HAIKU },
  'claude-haiku':      { ...HAIKU },
  // xAI — flagship 4.6, cheap same-provider 4.3. 4.20 / fast are aliases.
  'grok-4.7':          { ...GROK_46 },
  'grok-4.6':          { ...GROK_46 },
  'grok-4.5':          { ...GROK_46 },
  'grok-build-0.1':    { ...GROK_BUILD },
  'grok-4.3':          { ...GROK_43 },
  'grok-4.20':         { ...GROK_43 },
  'grok-4-1-fast':     { ...GROK_43 },
  // Google
  'gemini-3.1-pro':         { ...GEMINI_PRO },
  'gemini-3.1-pro-preview': { ...GEMINI_PRO },
  'gemini-3.8-flash':       { ...GEMINI_FLASH_3X },
  'gemini-3.7-flash':       { ...GEMINI_FLASH_3X },
  'gemini-3.6-flash':       { ...GEMINI_FLASH_3X },
  'gemini-3.5-flash':       { ...GEMINI_35_FLASH },
  'gemini-3.1-flash-lite':  { ...GEMINI_31_FLASH_LITE },
  'gemini-3.5-flash-lite':  { ...GEMINI_FLASH },
  'gemini-2.5-flash':       { ...GEMINI_FLASH },
  // OpenAI — live 5.6 ladder. 5.4 family kept as aliases (old prices).
  'gpt-6-astra':       { ...GPT_6_ASTRA },
  'gpt-6.1-sol':       { ...GPT_6_SOL },
  'gpt-6-sol':         { ...GPT_6_SOL },
  'gpt-6-luna':        { ...GPT_6_LUNA },
  'gpt-5.6-sol':       { ...GPT_SOL },
  'gpt-5.6-terra':     { ...GPT_TERRA },
  'gpt-5.6-luna':      { ...GPT_LUNA },
  'gpt-5.4':           { ...GPT_54 },
  'gpt-5.4-mini':      { ...GPT_54_MINI },
  'gpt-5.4-nano':      { ...GPT_54_NANO },
};

/**
 * Real API IDs → table keys, strictly: lowercase, drop a trailing date stamp
 * (`-20250514`), and write version numbers with dots (`claude-opus-4-7` →
 * `claude-opus-4.7`). No family guessing: an unknown version stays unknown,
 * so a new model never silently gets an older model's price.
 */
export function canonicalModel(name: string): string {
  if (MODELS[name]) return name;
  let n = name.trim().toLowerCase();
  if (MODELS[n]) return n;
  n = n.replace(/-\d{8}$/, '');
  if (MODELS[n]) return n;
  const dotted = n.replace(/(\d)-(\d)(?=$|-)/g, '$1.$2');
  if (MODELS[dotted]) return dotted;
  return n;
}

export function getModel(name: string): ModelInfo | undefined {
  return MODELS[canonicalModel(name)];
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
