import { getInstance, writeToMemory } from './wasm.js';

const WASM_INPUT_OFFSET = 4096;

/**
 * Per-model calibration factors.
 * Factor > 1.0 means "model uses more tokens than WASM predicts."
 * Applied as: estimate = wasm_estimate * factor (rounded up).
 *
 * Default 1.0 = no adjustment. Update after running bench/calibrate.ts.
 *
 * Re-derived 2026-08-23 from a fresh benchmark against real Anthropic
 * count_tokens ground truth (the 2026-04-16 factors were measured
 * against claude-opus-4-20250514, since retired — that baseline no
 * longer exists to verify against). Factor chosen as
 * 1 / min(observed_ratio) with a small safety margin, so it does not
 * under-report even against the worst sample in this benchmark:
 *
 * opus-4.7:   1.85 (was 1.50 — that value was insufficient: min observed
 *             ratio 0.571 needs >=1.75 just to avoid under-report, before
 *             any margin. Previously the factor also went UNUSED in
 *             production — see intercept.ts/preflight.ts history, fixed
 *             2026-08-23 same day)
 * claude-opus (generic, now routed to claude-opus-5): 1.85 — carried
 *             over from opus-4.7's measurement as the closest tested
 *             sibling; opus-5 itself has not been directly benchmarked
 * claude-sonnet (routed to claude-sonnet-5): 1.85 — measured directly,
 *             nearly identical drift to opus-4.7 (min ratio 0.580)
 * claude-haiku (routed to claude-haiku-4.5): 1.40 — measured directly,
 *             drifts less than the two above (min ratio 0.762)
 *
 * Known limitation: derived from a 9-sample benchmark corpus, several
 * of which are slash-tokens' own code/docs (not representative
 * third-party content). Re-run bench/calibrate.ts with a larger,
 * more diverse corpus before treating these as final.
 *
 * Slash must NEVER under-report. Over-reporting is safe (go/no-go only).
 */
const CALIBRATION: Record<string, number> = {
  'claude-opus':      1.85,
  'claude-opus-4.7':  1.85,
  'claude-sonnet':    1.85,
  'claude-haiku':     1.40,
};

/**
 * Fallback factor for any model not in CALIBRATION — new model IDs,
 * providers we haven't benchmarked yet, anything unrecognized.
 *
 * Deliberately the highest known-safe factor, not 1.0. "Unknown" must
 * never mean "no correction" — that's the most dangerous case, worse
 * than any calibrated model, because it silently assumes a brand-new
 * tokenizer behaves exactly like the raw WASM heuristic with zero
 * evidence either way. Slash must NEVER under-report; for a model we
 * haven't measured, the only safe assumption is the worst one we've
 * actually observed (see CALIBRATION comment above).
 */
const DEFAULT_UNKNOWN_MODEL_FACTOR = 1.85;

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
  const factor = CALIBRATION[model] ?? DEFAULT_UNKNOWN_MODEL_FACTOR;
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
