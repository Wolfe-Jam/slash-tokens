import { CATALOG, type CatalogEntry } from './catalog.js';
import { canonicalModel, effectiveRate } from './models.js';
import type { Quote } from './quote.js';

/**
 * Token usage as providers report it. OpenAI-style (OpenAI, xAI, Nebius Token
 * Factory, any OpenAI-compatible API) and Anthropic-style fields are both read.
 */
export interface Usage {
  // OpenAI-style: prompt_tokens includes cached tokens
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
  // Anthropic-style: input_tokens excludes cache reads and writes
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface ReconcileOptions {
  /** Model to compare against for "saved". Default: the quoted model (saved = 0). */
  baseline?: string;
  /** Share of the savings the agent's fee would take. Default 0.10. */
  feeRate?: number;
  /** Fee shown but not charged. Default true. */
  waived?: boolean;
}

export interface Receipt {
  model: string;
  provider: string;
  /** Date the prices on this receipt were checked. */
  asOf: string;
  estimate: { inputTokens: number; outputTokens: { min: number; max: number }; cost: { low: number; high: number } };
  actual: { inputTokens: number; outputTokens: number; cachedInputTokens: number; reasoningTokens: number; cost: number };
  /** (estimated − actual) / actual input tokens. Positive = over-counted (safe). */
  inputError: number;
  /** The estimate counted fewer input tokens than the provider billed. Slash should never do this. */
  underReported: boolean;
  /**
   * The actual cost did not exceed the quote's high end. (It can land below
   * the low end: input is deliberately over-counted.)
   */
  withinQuote: boolean;
  baseline: { model: string; cost: number };
  /** baseline.cost − actual.cost, USD. */
  saved: number;
  fee: { rate: number; amount: number; waived: boolean; charged: number };
}

const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

/** Provider usage → plain counts. Input includes cached tokens on both styles. */
export function normalizeUsage(u: Usage): { input: number; output: number; cached: number; reasoning: number } {
  if (u.input_tokens !== undefined || u.output_tokens !== undefined) {
    const cacheRead = u.cache_read_input_tokens ?? 0;
    return {
      input: (u.input_tokens ?? 0) + cacheRead + (u.cache_creation_input_tokens ?? 0),
      output: u.output_tokens ?? 0,
      cached: cacheRead,
      reasoning: 0,
    };
  }
  return {
    input: u.prompt_tokens ?? 0,
    output: u.completion_tokens ?? 0,
    cached: u.prompt_tokens_details?.cached_tokens ?? 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0,
  };
}

/**
 * Cost of a finished call. Cached input is priced at the full input rate (the
 * catalog carries no cache prices yet), so a cached call's cost is an upper
 * bound. Reasoning tokens are billed inside completion tokens, as providers do.
 */
function costOf(entry: CatalogEntry, input: number, output: number): number {
  const rate = effectiveRate(input, entry);
  return round6((input / 1_000_000) * rate.input + (output / 1_000_000) * rate.output);
}

/**
 * Compare a quote with what the provider billed and write the receipt:
 * estimate vs actual, saved vs a baseline model, and the agent's fee.
 */
export function reconcile(q: Quote, usage: Usage, opts: ReconcileOptions = {}): Receipt {
  const entry = CATALOG[q.model];
  const baseModel = canonicalModel(opts.baseline ?? q.model);
  const baseEntry = CATALOG[baseModel];
  if (!baseEntry) throw new Error(`Unknown baseline model: "${opts.baseline}"`);

  const u = normalizeUsage(usage);
  const cost = costOf(entry, u.input, u.output);
  // The baseline is priced on the same token counts (exact within one
  // provider's tokenizer; an approximation across providers).
  const baseCost = costOf(baseEntry, u.input, u.output);
  const saved = round6(baseCost - cost);
  const rate = opts.feeRate ?? 0.10;
  const amount = round6(Math.max(saved, 0) * rate);
  const waived = opts.waived ?? true;

  return {
    model: q.model,
    provider: q.provider,
    asOf: q.asOf,
    estimate: { inputTokens: q.inputTokens, outputTokens: q.outputTokens, cost: q.cost },
    actual: { inputTokens: u.input, outputTokens: u.output, cachedInputTokens: u.cached, reasoningTokens: u.reasoning, cost },
    inputError: u.input > 0 ? Math.round(((q.inputTokens - u.input) / u.input) * 10000) / 10000 : 0,
    underReported: q.inputTokens < u.input,
    withinQuote: cost <= q.cost.high,
    baseline: { model: baseModel, cost: baseCost },
    saved,
    fee: { rate, amount, waived, charged: waived ? 0 : amount },
  };
}
