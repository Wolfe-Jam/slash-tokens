import { slash } from './slash.js';
import { getModel, MODELS } from './models.js';
import { shouldRoute, isModelAllowed } from './config.js';

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

// Provider groups — routing only happens within same provider
const PROVIDER_MODELS: Record<string, string[]> = {
  'Anthropic': ['claude-opus', 'claude-sonnet', 'claude-haiku'],
  'OpenAI': ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'],
  'xAI': ['grok-4.20', 'grok-4-1-fast'],
  'Google': ['gemini-3.1-pro', 'gemini-2.5-flash'],
};

// Reverse lookup: model name → provider model names in the API
// (what to put back in the request body)
const MODEL_API_NAMES: Record<string, string> = {
  'claude-opus': 'claude-opus-4-20250514',
  'claude-sonnet': 'claude-sonnet-4-20250514',
  'claude-haiku': 'claude-haiku-4-20250414',
  'gpt-5.4': 'gpt-5.4',
  'gpt-5.4-mini': 'gpt-5.4-mini',
  'gpt-5.4-nano': 'gpt-5.4-nano',
  'grok-4.20': 'grok-4.20',
  'grok-4-1-fast': 'grok-4-1-fast',
  'gemini-3.1-pro': 'gemini-3.1-pro',
  'gemini-2.5-flash': 'gemini-2.5-flash',
};

// AI API endpoint detection
const AI_ENDPOINTS: Array<{ pattern: RegExp; provider: string; modelExtractor: (body: any) => string }> = [
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
    modelExtractor: (body) => 'gemini-2.5-flash',
  },
  {
    pattern: /api\.x\.ai/,
    provider: 'xAI',
    modelExtractor: (body) => body?.model || 'grok-4.20',
  },
];

// Normalize model names to our pricing table keys
function normalizeModel(raw: string): string {
  const lower = raw.toLowerCase();
  // Anthropic
  if (lower.includes('opus')) return 'claude-opus';
  if (lower.includes('sonnet')) return 'claude-sonnet';
  if (lower.includes('haiku')) return 'claude-haiku';
  // xAI
  if (lower.includes('grok') && lower.includes('fast')) return 'grok-4-1-fast';
  if (lower.includes('grok')) return 'grok-4.20';
  // Google
  if (lower.includes('gemini') && lower.includes('pro')) return 'gemini-3.1-pro';
  if (lower.includes('gemini')) return 'gemini-2.5-flash';
  // OpenAI
  if (lower.includes('5.4') && lower.includes('nano')) return 'gpt-5.4-nano';
  if (lower.includes('5.4') && lower.includes('mini')) return 'gpt-5.4-mini';
  if (lower.includes('5.4')) return 'gpt-5.4';
  // Legacy fallbacks
  if (lower.includes('4o-mini') || lower.includes('4o_mini')) return 'gpt-5.4-mini';
  if (lower.includes('4o') || lower.includes('4.1')) return 'gpt-5.4';
  if (lower.includes('grok-3')) return 'grok-4.20';
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
          const rawModel = match.modelExtractor(body);
          const originalModel = normalizeModel(rawModel);
          const tokens = slash(content);
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
