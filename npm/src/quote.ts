import { slash } from './slash.js';
import { CATALOG, type Tier } from './catalog.js';
import { canonicalModel, effectiveRate, MODELS } from './models.js';
import { PROVIDER_MODELS, NOT_ROUTE_TARGETS } from './providers.js';
import { shouldRoute, isModelAllowed } from './config.js';

export interface Message {
  role: string;
  content: string;
}

export interface Task {
  /** The prompt: a string, or chat messages. */
  input: string | Message[];
  model: string;
  /** High end of the output band. Default 4,096 (and the quote says it assumed it). */
  maxOutputTokens?: number;
  /** Low end of the output band. Default 0. */
  minOutputTokens?: number;
}

export interface Quote {
  /** Canonical catalog key. */
  model: string;
  provider: string;
  tier: Tier;
  inputTokens: number;
  outputTokens: { min: number; max: number };
  /** True when the caller gave no maxOutputTokens and the default was used. */
  outputAssumed: boolean;
  /** USD. low = input + min output; high = input + max output. */
  cost: { low: number; high: number };
  /** Input plus max output fits the context window. */
  fits: boolean;
  /** Date the price was checked. */
  asOf: string;
}

export interface Policy {
  /** Most the job may cost, USD, judged on the quote's high end. No budget = no limit. */
  budget?: number;
  /**
   * Lowest tier a substitute model may have. Default: the requested model's
   * own tier, so nothing is swapped for a smaller line unless you allow it.
   */
  floor?: Tier;
}

export type Action = 'go' | 'downgrade' | 'block';

export interface Decision {
  /** go = run the requested model · downgrade = run a cheaper model · block = run nothing. */
  action: Action;
  requested: Quote;
  /** The model to run; null when blocked. */
  chosen: Quote | null;
  /** requested.cost.high − chosen.cost.high (0 for go and block). */
  saved: number;
  reason: string;
}

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

/**
 * Request framing: tokens a provider bills on top of the message content
 * (chat template, role markers, system preamble). `request` is a one-message
 * request; `perMessage` is each message after the first. Content is counted
 * with the calibration factor; framing is added on top, so a quote doesn't
 * come in under the bill.
 *
 *   Nebius     measured 2026-10-08 (real calls, Nemotron 3.5 Lightning and
 *              3 Nano): 16 for one message, +13 for two more turns
 *              (bench/results-nemotron-requests.json). 7 per extra message.
 *   xAI        a fixed system preamble of 185–193 tokens per request
 *              (baselines in bench/results-grok.json); 193 used.
 *   OpenAI     3 per message + 3 to prime the reply (OpenAI's tiktoken
 *              cookbook, not measured here); 4 per message, the first one
 *              inside `request`.
 *   Anthropic  the calibration ground truth (count_tokens) already includes
 *              one message's framing; 4 per extra message, an allowance,
 *              not yet measured.
 *   Google     countTokens on content; 4 per message, an allowance, not yet
 *              measured.
 */
export const FRAMING: Record<string, { request: number; perMessage: number }> = {
  Nebius:    { request: 16,  perMessage: 7 },
  xAI:       { request: 193, perMessage: 4 },
  OpenAI:    { request: 7,   perMessage: 4 },
  Anthropic: { request: 0,   perMessage: 4 },
  Google:    { request: 4,   perMessage: 4 },
};
const DEFAULT_FRAMING = { request: 16, perMessage: 7 };

const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

/** Content (calibrated) plus the provider's framing. A string is sent as one message. */
function inputTokens(input: string | Message[], model: string, provider: string): number {
  const f = FRAMING[provider] ?? DEFAULT_FRAMING;
  const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  let total = f.request + f.perMessage * Math.max(messages.length - 1, 0);
  for (const m of messages) total += slash(m.content, model);
  return total;
}

/**
 * Price a job before it runs: input tokens, an output band, and a low–high
 * cost. Input is the content counted with the model's calibration factor
 * plus the provider's request framing (see FRAMING), so it doesn't come in
 * under the bill (checked against real bills for Nebius; an allowance for
 * the others); the long-context rate applies when the prompt crosses it.
 */
export function quote(task: Task): Quote {
  const model = canonicalModel(task.model);
  const entry = CATALOG[model];
  if (!entry) {
    throw new Error(`Unknown model: "${task.model}". Available: ${Object.keys(MODELS).join(', ')}`);
  }

  const outMax = task.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const outMin = Math.min(task.minOutputTokens ?? 0, outMax);
  const tokens = inputTokens(task.input, model, entry.provider);
  const rate = effectiveRate(tokens, entry);
  const inputCost = (tokens / 1_000_000) * rate.input;

  return {
    model,
    provider: entry.provider,
    tier: entry.tier,
    inputTokens: tokens,
    outputTokens: { min: outMin, max: outMax },
    outputAssumed: task.maxOutputTokens === undefined,
    cost: {
      low: round6(inputCost + (outMin / 1_000_000) * rate.output),
      high: round6(inputCost + (outMax / 1_000_000) * rate.output),
    },
    fits: tokens + outMax <= entry.context,
    asOf: entry.asOf,
  };
}

/**
 * Choose what to run under a budget and a quality floor.
 *
 * Candidates are the requested model plus its same-provider siblings at or
 * above the floor (never a NOT_ROUTE_TARGETS model, never one excluded by
 * init({ models }), none at all after init({ route: false })). Each is quoted
 * on its own token count. A substitute must cost less than the requested
 * model — decide() never raises the bill. The cheapest candidate that fits
 * and stays within budget wins (judged on the high end).
 */
export function decide(task: Task, policy: Policy = {}): Decision {
  const requested = quote(task);
  const budget = policy.budget ?? Infinity;
  const floor = policy.floor ?? requested.tier;

  const ok = (q: Quote) => q.fits && q.cost.high <= budget;

  let chosen: Quote | null = ok(requested) ? requested : null;
  if (shouldRoute()) {
    for (const m of PROVIDER_MODELS[requested.provider] ?? []) {
      if (m === requested.model || NOT_ROUTE_TARGETS.has(m) || !isModelAllowed(m)) continue;
      if (CATALOG[m].tier < floor) continue;
      const q = quote({ ...task, model: m });
      if (!ok(q) || q.cost.high >= requested.cost.high) continue;  // never raise the cost
      if (!chosen || q.cost.high < chosen.cost.high ||
          (q.cost.high === chosen.cost.high && CATALOG[m].input < CATALOG[chosen.model].input)) {
        chosen = q;
      }
    }
  }

  if (!chosen) {
    const why = !requested.fits
      ? `${requested.model} can't fit ${requested.inputTokens + requested.outputTokens.max} tokens`
      : `${requested.model} costs up to $${requested.cost.high}, over the $${budget} budget`;
    return { action: 'block', requested, chosen: null, saved: 0, reason: `${why}, and no model at or above tier ${floor} does better` };
  }
  if (chosen === requested) {
    const within = budget === Infinity ? 'fits' : `fits the $${budget} budget`;
    return { action: 'go', requested, chosen, saved: 0, reason: `${requested.model} is the cheapest model at or above tier ${floor} that ${within}` };
  }
  return {
    action: 'downgrade',
    requested,
    chosen,
    saved: round6(requested.cost.high - chosen.cost.high),
    reason: requested.fits && requested.cost.high <= budget
      ? `${chosen.model} (tier ${chosen.tier}) does the job for less`
      : `${requested.model} doesn't fit the ${requested.fits ? 'budget' : 'context window'}; ${chosen.model} (tier ${chosen.tier}) does`,
  };
}
