import { slash } from './slash.js';
import { getModel, MODELS } from './models.js';
import { shouldRoute, isModelAllowed } from './config.js';
import { PROVIDER_MODELS } from './providers.js';

// TEST-NOTE: intercept.ts and preflight.ts MUST share PROVIDER_MODELS.
// Duplicating it locally here (as pre-v1.4.0 did) caused cross-function
// semantic drift. Any test that asserts "preflightRoute agrees with
// findCheapestRoute" relies on this shared import.

export interface InterceptEvent {
  endpoint: string;
  provider: string;
  model: string;
  originalModel: string;
  tokens: number;
  cost: number;
  originalCost: number;
  salvaged: number;
  fits: boolean;
  routed: boolean;
  timestamp: string;
}

// Reverse lookup: model name → provider model names in the API
// (what to put back in the request body)
const MODEL_API_NAMES: Record<string, string> = {
  'claude-opus': 'claude-opus-5',
  'claude-opus-4.7': 'claude-opus-4-7',
  'claude-sonnet': 'claude-sonnet-5',
  'claude-haiku': 'claude-haiku-4-5-20251001',
  'gpt-5.4': 'gpt-5.4',
  'gpt-5.4-mini': 'gpt-5.4-mini',
  'gpt-5.4-nano': 'gpt-5.4-nano',
  'grok-4.20': 'grok-4.20-0309-non-reasoning',
  'grok-4-1-fast': 'grok-4.3',
  'gemini-3.1-pro': 'gemini-pro-latest',
  'gemini-2.5-flash': 'gemini-flash-latest',
};

// AI API endpoint detection
const AI_ENDPOINTS: Array<{ pattern: RegExp; provider: string; modelExtractor: (body: any, url?: string) => string }> = [
  {
    pattern: /api\.anthropic\.com/,
    provider: 'Anthropic',
    modelExtractor: (body) => body?.model || 'claude-sonnet',
  },
  {
    pattern: /api\.openai\.com/,
    provider: 'OpenAI',
    modelExtractor: (body) => body?.model || 'gpt-5.4',
  },
  {
    pattern: /generativelanguage\.googleapis\.com/,
    provider: 'Google',
    modelExtractor: (_body, url) => {
      // Model is in the URL path: /v1beta/models/gemini-2.0-flash:generateContent
      const match = url?.match(/\/models\/([^/:]+)/);
      return match ? match[1] : 'gemini-2.5-flash';
    },
  },
  {
    pattern: /api\.x\.ai/,
    provider: 'xAI',
    modelExtractor: (body) => body?.model || 'grok-4.20',
  },
];

// Normalize model names to our pricing table keys.
// Kept in sync by hand with mcpaas-cf/src/slash-models.ts's normalizeModel
// (no shared import between the two repos) — fixed 2026-08-23: this copy
// was missing the opus-4.7 special case and several OpenAI legacy
// fallbacks the other copy already had, which silently mapped those
// intercepted calls to generic claude-opus / an unmapped raw string
// (getModel() returning undefined → $0 reported cost, see slash.ts's
// DEFAULT_UNKNOWN_MODEL_FACTOR comment for why "unrecognized" defaulting
// to a falsely-safe-looking value is the dangerous case).
export function normalizeModel(raw: string): string {
  const lower = raw.toLowerCase();
  // Anthropic — 4.7 before generic opus check, same order as slash-models.ts
  if (lower.includes('opus') && (lower.includes('4-7') || lower.includes('4.7'))) return 'claude-opus-4.7';
  if (lower.includes('opus')) return 'claude-opus';
  if (lower.includes('sonnet')) return 'claude-sonnet';
  if (lower.includes('haiku')) return 'claude-haiku';
  // xAI
  if (lower.includes('grok') && lower.includes('fast')) return 'grok-4-1-fast';
  if (lower.includes('grok')) return 'grok-4.20';
  // Google
  if (lower.includes('gemini') && lower.includes('pro')) return 'gemini-3.1-pro';
  if (lower.includes('gemini')) return 'gemini-2.5-flash';
  // OpenAI — current (5.4 family)
  if (lower.includes('5.4') && lower.includes('nano')) return 'gpt-5.4-nano';
  if (lower.includes('5.4') && lower.includes('mini')) return 'gpt-5.4-mini';
  if (lower.includes('5.4')) return 'gpt-5.4';
  // OpenAI — legacy model names → map to closest current equivalent
  if (lower.includes('o1-mini') || lower.includes('o1_mini')) return 'gpt-5.4-mini';
  if (lower.includes('o1')) return 'gpt-5.4';
  if (lower.includes('4o-mini') || lower.includes('4o_mini')) return 'gpt-5.4-mini';
  if (lower.includes('4o') || lower.includes('4.1')) return 'gpt-5.4';
  if (lower.includes('gpt-4-turbo') || lower.includes('gpt-4-1')) return 'gpt-5.4';
  if (lower.includes('gpt-4')) return 'gpt-5.4';
  if (lower.includes('gpt-3.5') || lower.includes('gpt-35')) return 'gpt-5.4-nano';
  return raw;
}

// Extract message content from request body
function extractContent(body: any): string {
  if (!body) return '';
  if (body.messages && Array.isArray(body.messages)) {
    return body.messages
      .map((m: any) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join('\n');
  }
  if (typeof body.prompt === 'string') return body.prompt;
  if (body.contents && Array.isArray(body.contents)) {
    return body.contents
      .flatMap((c: any) => c.parts || [])
      .map((p: any) => p.text || '')
      .join('\n');
  }
  return JSON.stringify(body);
}

// Find cheapest model from same provider that fits
function findCheapestRoute(provider: string, tokens: number, currentModel: string): string | null {
  const providerModels = PROVIDER_MODELS[provider];
  if (!providerModels) return null;

  let cheapest: { model: string; inputCost: number } | null = null;

  for (const model of providerModels) {
    if (model === currentModel) continue;
    if (!isModelAllowed(model)) continue; // user excluded this model
    const info = getModel(model);
    if (!info) continue;
    if (tokens > info.context) continue; // doesn't fit
    if (info.input >= (getModel(currentModel)?.input ?? 0)) continue; // not cheaper
    if (!cheapest || info.input < cheapest.inputCost) {
      cheapest = { model, inputCost: info.input };
    }
  }

  return cheapest?.model ?? null;
}

let _onIntercept: ((event: InterceptEvent) => void) | null = null;

export function onIntercept(handler: (event: InterceptEvent) => void): void {
  _onIntercept = handler;
}

export function patchFetch(): void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function slashFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this is an AI API call
    const match = AI_ENDPOINTS.find(ep => ep.pattern.test(url));

    if (match && init?.body) {
      try {
        const bodyStr = typeof init.body === 'string' ? init.body : undefined;
        if (bodyStr) {
          const body = JSON.parse(bodyStr);
          const content = extractContent(body);
          const rawModel = match.modelExtractor(body, url);
          const originalModel = normalizeModel(rawModel);
          const tokens = slash(content, originalModel);
          const originalInfo = getModel(originalModel);
          const originalCost = originalInfo ? Math.round(((tokens / 1_000_000) * originalInfo.input) * 1_000_000) / 1_000_000 : 0;
          const fits = originalInfo ? tokens <= originalInfo.context : true;

          // Find cheapest route within same provider (if routing enabled)
          const routeModel = shouldRoute() ? findCheapestRoute(match.provider, tokens, originalModel) : null;
          const routedInfo = routeModel ? getModel(routeModel) : null;
          const routedCost = routedInfo ? Math.round(((tokens / 1_000_000) * routedInfo.input) * 1_000_000) / 1_000_000 : originalCost;
          const salvaged = routeModel ? Math.round((originalCost - routedCost) * 1_000_000) / 1_000_000 : 0;

          const event: InterceptEvent = {
            endpoint: url,
            provider: match.provider,
            model: routeModel || originalModel,
            originalModel,
            tokens,
            cost: routeModel ? routedCost : originalCost,
            originalCost,
            salvaged,
            fits,
            routed: !!routeModel,
            timestamp: new Date().toISOString(),
          };

          if (_onIntercept) {
            _onIntercept(event);
          }

          // If routed, rewrite the request body with the cheaper model
          if (routeModel && init) {
            const apiModelName = MODEL_API_NAMES[routeModel] || routeModel;
            body.model = apiModelName;
            init = { ...init, body: JSON.stringify(body) };
          }
        }
      } catch {
        // Non-blocking — never break the actual API call
      }
    }

    return originalFetch(input, init);
  };
}
