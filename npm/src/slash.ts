import { getInstance, writeToMemory } from './wasm.js';

const WASM_INPUT_OFFSET = 4096;

/**
 * Per-model calibration factors.
 * WASM estimator was tuned for Opus 4.6. Newer tokenizers may drift.
 * Factor > 1.0 means "model uses more tokens than WASM predicts."
 * Applied as: estimate = wasm_estimate * factor (rounded up).
 *
 * Default 1.0 = no adjustment. Update after running bench/calibrate.ts.
 */
const CALIBRATION: Record<string, number> = {
  'claude-opus':      1.0,
  'claude-opus-4.7':  1.0,  // TBD — run bench/calibrate.ts when API is live
  'claude-sonnet':    1.0,
  'claude-haiku':     1.0,
};

/**
 * Estimate token count for a string.
 * Sub-millisecond. Zero allocations in WASM.
 * Optional model parameter applies per-model calibration.
 */
export function slash(content: string, model?: string): number {
  if (!content) return 0;
  const len = writeToMemory(content);
  const instance = getInstance();
  const raw = (instance.exports.estimate_tokens as Function)(WASM_INPUT_OFFSET, len);
  if (!model) return raw;
  const factor = CALIBRATION[model] ?? 1.0;
  return factor === 1.0 ? raw : Math.ceil(raw * factor);
}

/**
 * Estimate token count from raw bytes.
 */
export function slashBytes(bytes: Uint8Array): number {
  if (!bytes.length) return 0;
  const instance = getInstance();
  const memory = instance.exports.memory as WebAssembly.Memory;
  const buffer = new Uint8Array(memory.buffer);
  const maxLen = Math.min(bytes.length, buffer.length - WASM_INPUT_OFFSET - 1);
  buffer.set(bytes.subarray(0, maxLen), WASM_INPUT_OFFSET);
  return (instance.exports.estimate_tokens as Function)(WASM_INPUT_OFFSET, maxLen);
}
