import { slash } from './slash.js';
import { getModel } from './models.js';

export interface InterceptEvent {
  endpoint: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  fits: boolean;
  timestamp: string;
}

// AI API endpoint detection — same patterns as scanner, runtime version
const AI_ENDPOINTS: Array<{ pattern: RegExp; provider: string; modelExtractor: (body: any) => string }> = [
  {
    pattern: /api\.anthropic\.com/,
    provider: 'Anthropic',
    modelExtractor: (body) => body?.model || 'claude-sonnet',
  },
  {
    pattern: /api\.openai\.com/,
    provider: 'OpenAI',
    modelExtractor: (body) => body?.model || 'gpt-4o',
  },
  {
    pattern: /generativelanguage\.googleapis\.com/,
    provider: 'Google',
    modelExtractor: (body) => 'gemini-2.0-flash',
  },
  {
    pattern: /api\.x\.ai/,
    provider: 'xAI',
    modelExtractor: (body) => body?.model || 'grok-3',
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

  // Anthropic: { messages: [{ content: "..." }] }
  // OpenAI: { messages: [{ content: "..." }] }
  if (body.messages && Array.isArray(body.messages)) {
    return body.messages
      .map((m: any) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join('\n');
  }

  // Anthropic: { prompt: "..." }
  if (typeof body.prompt === 'string') return body.prompt;

  // Google: { contents: [{ parts: [{ text: "..." }] }] }
  if (body.contents && Array.isArray(body.contents)) {
    return body.contents
      .flatMap((c: any) => c.parts || [])
      .map((p: any) => p.text || '')
      .join('\n');
  }

  return JSON.stringify(body);
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
          const model = normalizeModel(rawModel);
          const tokens = slash(content);
          const info = getModel(model);
          const cost = info ? Math.round(((tokens / 1_000_000) * info.input) * 1_000_000) / 1_000_000 : 0;
          const fits = info ? tokens <= info.context : true;

          const event: InterceptEvent = {
            endpoint: url,
            provider: match.provider,
            model,
            tokens,
            cost,
            fits,
            timestamp: new Date().toISOString(),
          };

          if (_onIntercept) {
            _onIntercept(event);
          }
        }
      } catch {
        // Non-blocking — never break the actual API call
      }
    }

    return originalFetch(input, init);
  };
}
