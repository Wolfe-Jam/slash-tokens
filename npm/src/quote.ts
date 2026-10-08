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

/** Role framing per chat message — a little over what providers add, so it never under-counts. */
const MESSAGE_OVERHEAD_TOKENS = 4;

const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

function inputTokens(input: string | Message[], model: string): number {
  if (typeof input === 'string') return slash(input, model);
  let total = 0;
  for (const m of input) total += slash(m.content, model) + MESSAGE_OVERHEAD_TOKENS;
  return total;
}

/**
 * Price a job before it runs: input tokens, an output band, and a low–high
 * cost. Input is counted with the model's calibration factor (never
 * under-reports); the long-context rate applies when the prompt crosses it.
 */
export function quote(task: Task): Quote {
  const model = canonicalModel(task.model);
  const entry = CATALOG[model];
  if (!entry) {
    throw new Error(`Unknown model: "${task.model}". Available: ${Object.keys(MODELS).join(', ')}`);
  }

  const outMax = task.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const outMin = Math.min(task.minOutputTokens ?? 0, outMax);
  const tokens = inputTokens(task.input, model);
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
