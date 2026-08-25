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
    'claude-opus-5', 'claude-opus', 'claude-opus-4.7',
    'claude-sonnet-5', 'claude-sonnet',
    'claude-haiku', 'claude-haiku-4.5',
  ],
  OpenAI: [
    'gpt-5.6-sol', 'gpt-5.6-terra',
    'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano',
    'gpt-5.6-luna',
  ],
  xAI: ['grok-4.6', 'grok-4.3', 'grok-4.20', 'grok-4-1-fast'],
  Google: ['gemini-3.1-pro', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'],
};

export function providerOf(model: string): string | null {
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    if (models.includes(model)) return provider;
  }
  return null;
}
