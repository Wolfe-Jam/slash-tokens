/**
 * Provider groups — single source of truth.
 *
 * Slash routing is always SAME-PROVIDER. Opus → Haiku, GPT-5.4 → Nano,
 * Grok-4.20 → Fast, Gemini 3.1 Pro → 2.5 Flash. Never cross-provider.
 *
 * This file is the canonical provider mapping. Both `intercept.ts`
 * (runtime fetch patching) and `preflight.ts` (analysis + routing
 * prediction) consume from here so they can never drift.
 *
 * TEST-NOTE: Whenever a new model is added, it MUST appear in exactly one
 * provider group below. A model missing from here will:
 *   - Never be a routing target from `findCheapestRoute` / `preflightRoute`
 *   - Still appear in `preflight().options` (which is cross-provider analysis)
 *   That mismatch is by design — see preflight.ts semantics.
 */

export const PROVIDER_MODELS: Record<string, string[]> = {
  Anthropic: ['claude-opus', 'claude-opus-4.7', 'claude-sonnet', 'claude-haiku'],
  OpenAI: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'],
  xAI: ['grok-4.20', 'grok-4-1-fast'],
  Google: ['gemini-3.1-pro', 'gemini-2.5-flash'],
};

/**
 * Identify a model's provider from its canonical key.
 *
 * TEST-NOTE: This function MUST return a non-null provider for every model
 * present in `MODELS` (from models.ts). If `MODELS` adds a model without
 * adding it to `PROVIDER_MODELS`, this returns null and routing is disabled
 * for that model. Silent skip.
 */
export function providerOf(model: string): string | null {
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    if (models.includes(model)) return provider;
  }
  return null;
}
