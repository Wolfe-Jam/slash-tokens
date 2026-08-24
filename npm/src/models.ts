export interface ModelInfo {
  input: number;    // $/M input tokens (base/short-context rate)
  output: number;   // $/M output tokens (base/short-context rate)
  context: number;  // max context window
  // Optional long-context pricing tier — added 2026-08-23. xAI bills the
  // WHOLE request at a higher rate once the prompt exceeds this threshold
  // (confirmed against docs.x.ai/docs/models). Only Grok has this today;
  // every other model leaves these undefined and effectiveRate() below
  // just returns the base input/output unchanged.
  longContextThreshold?: number;
  longContextInput?: number;
  longContextOutput?: number;
}

// Pricing as of April 2026 — USD per million tokens
// Claude Sonnet 5 pricing corrected 2026-08-23: was hardcoded at $3.00/
// $15.00 (the previously-scheduled Sept 1, 2026 increase), but Anthropic's
// own pricing page confirms that increase will NOT occur — $2.00/$10.00
// (the introductory rate) is now the permanent standard price. Found via
// a full-codebase review that independently re-verified every provider's
// live pricing, not just the model IDs already fixed that day.
// xAI pricing re-derived 2026-08-23: grok-4.20 and grok-4-1-fast (the literal
// API IDs, not just the generic keys below) were both fully retired — not
// just old snapshots, they 404 on the live API. Current lineup has no cheap
// tier at all; grok-4.20 (generic) now targets grok-4.20-0309-non-reasoning
// and grok-4-1-fast (generic) targets grok-4.3, both $1.25/$2.50/1M — see
// intercept.ts MODEL_API_NAMES. There is currently no xAI model cheaper than
// $1.25/M input, so routing between these two generic keys yields zero
// savings (findCheapestRoute requires strictly cheaper — this is honest,
// not a bug: the old $0.20/M "fast" tier no longer exists).
export const MODELS: Record<string, ModelInfo> = {
  // Anthropic
  'claude-opus':     { input:  5.00, output: 25.00, context: 1000000 },
  'claude-opus-4.7': { input:  5.00, output: 25.00, context: 1000000 },
  'claude-sonnet':   { input:  2.00, output: 10.00, context: 1000000 },
  'claude-haiku':    { input:  1.00, output:  5.00, context: 200000 },
  // xAI
  'grok-4.20':       { input:  1.25, output:  2.50, context: 1000000, longContextThreshold: 200000, longContextInput: 2.50, longContextOutput: 5.00 },
  'grok-4-1-fast':   { input:  1.25, output:  2.50, context: 1000000, longContextThreshold: 200000, longContextInput: 2.50, longContextOutput: 5.00 },
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

// Resolve the actual billable rate for a given token count — applies the
// long-context tier above if the model has one and tokens cross it.
// preflight()/preflightRoute() should go through this, not read
// .input/.output directly, or a Grok call over 200K tokens gets silently
// under-costed at the base rate.
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
