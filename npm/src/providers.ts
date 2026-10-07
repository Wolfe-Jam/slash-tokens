import { canonicalModel } from './models.js';
/**
 * Provider groups — single source of truth.
 *
 * Slash routing is always SAME-PROVIDER. Opus 5 → Haiku 4.5, Sol → Luna,
 * Grok 4.6 → 4.3, Gemini 3.1 Pro → 3.5 Flash-Lite. Never cross-provider.
 *
 * Order inside a group matters when two models share a price: the first
 * strictly-cheaper hit wins (findCheapestRoute / preflightRoute).
 */

export const PROVIDER_MODELS: Record<string, string[]> = {
  Anthropic: [
    'claude-fable-5.1', 'claude-fable-5', 'claude-mythos-5.1', 'claude-mythos-5',
    'claude-opus-5', 'claude-opus', 'claude-opus-4.8', 'claude-opus-4.7',
    'claude-opus-4.6', 'claude-opus-4.5', 'claude-opus-5.5',
    'claude-sonnet-4.6', 'claude-sonnet-4.5',
    'claude-sonnet-5.5', 'claude-sonnet-5', 'claude-sonnet',
    'claude-haiku', 'claude-haiku-4.5',
  ],
  OpenAI: [
    'gpt-6-astra',
    'gpt-5.6-sol', 'gpt-5.6-terra',
    'gpt-5.4', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-5.4-mini', 'gpt-5.4-nano',
    'gpt-5.6-luna', 'gpt-6-luna',
  ],
  xAI: ['grok-4.7', 'grok-4.6', 'grok-4.5', 'grok-4.3', 'grok-4.20', 'grok-4-1-fast', 'grok-build-0.1'],
  Google: [
    'gemini-3.1-pro', 'gemini-3.1-pro-preview',
    'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash',
    'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.1-flash-lite',
  ],
};

/**
 * Priced and grouped, but never a routing TARGET: specialised models a general
 * call shouldn't be moved to (grok-build-0.1 is a coding-agent model).
 */
export const NOT_ROUTE_TARGETS: ReadonlySet<string> = new Set(['grok-build-0.1']);

export function providerOf(model: string): string | null {
  const id = canonicalModel(model);
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    if (models.includes(id)) return provider;
  }
  return null;
}
