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
 * SUPERSEDED same day: the first pass (1.85 / 1.85 / 1.40 below) was
 * measured against a 9-sample corpus with no non-English text and no
 * SQL/bash. Expanding the corpus to 29 samples (still 2026-08-23) found
 * a WORSE case for every Claude model — Spanish prose (ratio 0.517) and
 * SQL/bash syntax (~0.53) drift far more than the original English/JS
 * corpus ever showed. 1.85 was live in production (v1.5.0) as an
 * insufficient factor for real Spanish-language and SQL/bash traffic
 * until this second pass caught it — the exact failure mode this whole
 * exercise exists to prevent. Re-verify again if the corpus grows further.
 *
 * opus-4.7:   2.05 (was 1.85, was 1.50 before that — min observed ratio
 *             now 0.517 needs >=1.934 before margin, found on Spanish
 *             prose, not on any sample in the original 9-item corpus)
 * claude-opus (generic, now routed to claude-opus-5): 2.05 — carried
 *             over from opus-4.7's measurement as the closest tested
 *             sibling; opus-5 itself has not been directly benchmarked
 * claude-sonnet (routed to claude-sonnet-5): 2.05 — measured directly,
 *             nearly identical drift to opus-4.7 (min ratio 0.525, same
 *             Spanish-prose sample)
 * claude-haiku (routed to claude-haiku-4.5): 1.45 (was 1.40) — drifts
 *             less than the two above but still worsened under the
 *             bigger corpus (min ratio 0.744, was 0.762)
 * gemini-3.1-pro / gemini-2.5-flash: 1.40 — measured 2026-08-23 against
 *             Google's free countTokens endpoint via the gemini-pro-latest
 *             / gemini-flash-latest aliases (min ratio 0.768, identical
 *             for both — pro/flash share one tokenizer this generation).
 *             Note: 'gemini-3.1-pro' as a literal model ID does not exist
 *             on the live API (404) — same stale-hardcoded-ID class of bug
 *             as the retired Claude snapshots, caught the same day. See
 *             intercept.ts MODEL_API_NAMES: the wire name is now the
 *             '-latest' alias, which sidesteps this whole bug class going
 *             forward since Google repoints it, not us.
 *             ⚠ NOT YET RE-VERIFIED against the 29-sample corpus — measured
 *             only against the original 9. Given Claude's factor needed a
 *             ~11% bump once Spanish/SQL/bash samples were added, treat
 *             this number as provisional until re-run.
 * gpt-5.4 / gpt-5.4-mini / gpt-5.4-nano: 1.15 — measured 2026-08-23
 *             against js-tiktoken's o200k_base (free, local, exact — same
 *             encoding for the whole GPT-5.4 family per OpenAI's own
 *             tiktoken docs). Min ratio 0.923 against the expanded
 *             29-sample corpus. This was a real gap, not just an accuracy
 *             tweak: GPT had a calibration SCRIPT (bench/calibrate-openai.ts)
 *             from the same day as the Claude fixes, but was never actually
 *             added to this table — it was silently falling through to
 *             DEFAULT_UNKNOWN_MODEL_FACTOR (1.85), a ~60% larger correction
 *             than it needed. Still safe either way (1.85 > required
 *             minimum), just needlessly inflated for real GPT users.
 * grok-4.20 / grok-4-1-fast: 1.15 — measured 2026-08-23 (min ratio 0.928,
 *             the least drift of any provider tested — Grok's tokenizer
 *             runs fewer tokens per content than the others, so raw WASM
 *             already over-reports on most samples). xAI has no free
 *             count-tokens endpoint; this used real chat completions
 *             (max_tokens: 1) with a per-model baseline subtracted to
 *             remove xAI's fixed system-preamble overhead (~185-193
 *             tokens, mostly cached) from the content-only count.
 *             Both literal API IDs ('grok-4.20', 'grok-4-1-fast') are
 *             fully retired — not just old snapshots, gone entirely —
 *             remapped to grok-4.20-0309-non-reasoning / grok-4.3 in
 *             intercept.ts MODEL_API_NAMES the same day this was found.
 *             ⚠ NOT YET RE-VERIFIED against the 29-sample corpus — same
 *             caveat as Gemini above. Costs real (small) money per run,
 *             unlike Gemini/Anthropic, so re-verify deliberately, not
 *             reflexively, but don't skip it — Grok has not been tested
 *             against non-English content or SQL/bash at all yet, and
 *             those are exactly what broke Claude's factor.
 *
 * Known limitation: Claude's factors are now verified against a 29-sample
 * corpus (expanded 2026-08-23 from the original 9, which was mostly
 * slash-tokens' own code/docs — not representative third-party content).
 * Gemini and Grok above are still only verified against the old 9-sample
 * set — re-run bench/calibrate-gemini.ts and bench/calibrate-grok.ts
 * before trusting those two numbers as final.
 *
 * Slash must NEVER under-report. Over-reporting is safe (go/no-go only).
 */
const CALIBRATION: Record<string, number> = {
  'claude-opus':      2.05,
  'claude-opus-4.7':  2.05,
  'claude-sonnet':    2.05,
  'claude-haiku':     1.45,
  'gemini-3.1-pro':   1.40,
  'gemini-2.5-flash': 1.40,
  'grok-4.20':        1.15,
  'grok-4-1-fast':    1.15,
  'gpt-5.4':          1.15,
  'gpt-5.4-mini':     1.15,
  'gpt-5.4-nano':     1.15,
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
const DEFAULT_UNKNOWN_MODEL_FACTOR = 2.05;

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
