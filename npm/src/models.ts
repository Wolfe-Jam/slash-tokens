import { CATALOG, API_ALIASES } from './catalog.js';

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

// The price table, derived from the catalog (catalog.ts): same keys, same
// order, same fields as before 1.7.0. Old keys stay as aliases so existing
// call sites don't throw.
export const MODELS: Record<string, ModelInfo> = Object.fromEntries(
  Object.entries(CATALOG).map(([name, { provider: _p, tier: _t, asOf: _a, ...price }]) => [name, price]),
);

/**
 * Real API IDs → table keys, strictly: lowercase, drop a trailing date stamp
 * (`-20250514`), and write version numbers with dots (`claude-opus-4-7` →
 * `claude-opus-4.7`); IDs that follow another scheme (`nvidia/…`) map through
 * API_ALIASES in the catalog. No family guessing: an unknown version stays unknown,
 * so a new model never silently gets an older model's price.
 */
export function canonicalModel(name: string): string {
  if (MODELS[name]) return name;
  let n = name.trim().toLowerCase();
  if (MODELS[n]) return n;
  n = n.replace(/-\d{8}$/, '');
  if (MODELS[n]) return n;
  if (API_ALIASES[n]) return API_ALIASES[n];
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
