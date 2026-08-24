import { slash } from './slash.js';
import { getModel, MODELS, effectiveRate, type ModelInfo } from './models.js';
import { PROVIDER_MODELS, providerOf } from './providers.js';
import { shouldRoute, isModelAllowed } from './config.js';

export interface Alternative {
  model: string;
  cost: number;
  salvaged: number;
  salvagePercent: number;
}

export interface PreflightResult {
  tokens: number;
  cost: number;
  fits: boolean;
  model: string;
  context: number;
  utilization: number;
  options: Alternative[];
}

/**
 * Compute cost of a prompt of `tokens` tokens on the given ModelInfo.
 * Uses input-token price only (output is not known at preflight time).
 * Rounded to 6 decimals. Goes through effectiveRate() so a long-context
 * model (currently only Grok, over 200K tokens) isn't silently costed at
 * its base rate — fixed 2026-08-23.
 */
function computeCost(tokens: number, info: ModelInfo): number {
  const rate = effectiveRate(tokens, info);
  return Math.round(((tokens / 1_000_000) * rate.input) * 1_000_000) / 1_000_000;
}

function buildAlternative(model: string, originalCost: number, tokens: number, info: ModelInfo): Alternative {
  const altCost = computeCost(tokens, info);
  return {
    model,
    cost: altCost,
    salvaged: Math.round((originalCost - altCost) * 1_000_000) / 1_000_000,
    salvagePercent:
      originalCost > 0 ? Math.round(((originalCost - altCost) / originalCost) * 10000) / 100 : 0,
  };
}

/**
 * Analysis tool — returns ALL cheaper models across ALL providers.
 *
 * Use this to SHOW developers what their alternatives are, regardless of
 * whether Slash would actually route there. If you want "what will the
 * Slash proxy ACTUALLY route to right now?", use `preflightRoute()`.
 *
 * TEST-NOTE (critical):
 *   - `options` is intentionally cross-provider — this is an analysis tool.
 *   - `options[0]` is NOT the routing decision. Using it as such is a bug.
 *   - See `preflightRoute()` for the actual routing decision that matches
 *     the mcpaas-cf proxy's findCheapestRoute semantics.
 *   - A test should assert that preflight().options may contain cross-provider
 *     entries (e.g. given model='claude-opus', options[0]?.model CAN be 'grok-...').
 */
export function preflight(content: string, model: string): PreflightResult {
  const tokens = slash(content, model);
  const info = getModel(model);

  if (!info) {
    throw new Error(
      `Unknown model: "${model}". Available: ${Object.keys(MODELS).join(', ')}`
    );
  }

  const cost = computeCost(tokens, info);
  const fits = tokens <= info.context;
  const utilization = Math.round((tokens / info.context) * 10000) / 10000;

  const options: Alternative[] = Object.entries(MODELS)
    .filter(([m]) => m !== model)
    .filter(([, v]) => v.context >= tokens)
    .map(([m, v]) => buildAlternative(m, cost, tokens, v))
    .filter(o => o.salvaged > 0)
    .sort((a, b) => a.cost - b.cost);

  return { tokens, cost, fits, model, context: info.context, utilization, options };
}

/**
 * Routing decision — matches mcpaas-cf proxy's `findCheapestRoute` exactly.
 *
 * Returns the single cheapest SAME-PROVIDER alternative that fits the prompt,
 * or null if no cheaper same-provider option exists (or model unknown,
 * or model's provider unknown).
 *
 * This is what you want to display as "what would Slash route to" — it
 * matches the proxy's actual behavior.
 *
 * TEST-NOTE (critical, must never regress):
 *   - Same-provider only. `preflightRoute('hello', 'claude-opus')` must NEVER
 *     return a model outside Anthropic. Add a test that asserts this for every
 *     canonical model in PROVIDER_MODELS.
 *   - Returns null when: model unknown, provider unknown, or no cheaper same-
 *     provider alternative exists. Null is a valid result ("PASS, no route").
 *   - Cheapest SAME-PROVIDER alternative by input price. If two alternatives
 *     tie on price (unlikely but possible), returns the first encountered in
 *     PROVIDER_MODELS order.
 *   - Must agree with intercept.ts findCheapestRoute for identical inputs,
 *     INCLUDING respecting the same init() config gates: shouldRoute()
 *     (init({route: false}) must make this always return null, matching
 *     patchFetch() never routing) and isModelAllowed() (init({models: [...]})
 *     must exclude any candidate not in that list, matching
 *     findCheapestRoute's real filtering). Fixed 2026-08-23 — this
 *     function used to ignore both, so a call site previewing "what will
 *     Slash route to" via preflightRoute() would show a route recommendation
 *     that real traffic through patchFetch() would never actually take
 *     under the same config, silently breaking the "matches exactly" promise.
 */
export function preflightRoute(content: string, model: string): Alternative | null {
  if (!shouldRoute()) return null;

  const tokens = slash(content, model);
  const info = getModel(model);
  if (!info) return null;

  const provider = providerOf(model);
  if (!provider) return null;

  const providerModels = PROVIDER_MODELS[provider];
  if (!providerModels) return null;

  const originalCost = computeCost(tokens, info);

  let cheapest: Alternative | null = null;
  for (const m of providerModels) {
    if (m === model) continue;
    if (!isModelAllowed(m)) continue;             // user excluded this model
    const altInfo = getModel(m);
    if (!altInfo) continue;
    if (tokens > altInfo.context) continue;       // doesn't fit
    if (altInfo.input >= info.input) continue;    // not cheaper

    const alt = buildAlternative(m, originalCost, tokens, altInfo);
    if (!cheapest || alt.cost < cheapest.cost) {
      cheapest = alt;
    }
  }

  return cheapest;
}
