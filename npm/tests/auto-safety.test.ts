/**
 * 1.6.6 — /auto safety (option B) + report() privacy.
 * /auto keeps its 1.6.5 routing: same identification, same targets. New
 * models are priced correctly but never rewritten to until 1.7.0.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { findCheapestRoute, identifyModel, normalizeModel } from '../src/intercept';
import { report } from '../src/transact';
import { getModel } from '../src/models';

describe('/auto routing is frozen at 1.6.5 within 1.6.x', () => {
  it('routes to the same models as 1.6.5', () => {
    expect(findCheapestRoute('Anthropic', 1000, 'claude-opus-5')).toBe('claude-haiku');
    expect(findCheapestRoute('OpenAI', 1000, 'gpt-5.6-sol')).toBe('gpt-5.4-nano');
    expect(findCheapestRoute('xAI', 1000, 'grok-4.6')).toBe('grok-4.3');
    expect(findCheapestRoute('Google', 1000, 'gemini-3.1-pro')).toBe('gemini-3.5-flash-lite');
  });

  it('never rewrites to a model added in 1.6.6', () => {
    for (const [provider, from] of [['OpenAI', 'gpt-5.6-sol'], ['Google', 'gemini-3.1-pro'], ['xAI', 'grok-4.6'], ['Anthropic', 'claude-opus-5']]) {
      const to = findCheapestRoute(provider, 1000, from);
      expect(['gpt-6-luna', 'gpt-6-sol', 'gpt-6.1-sol', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'grok-build-0.1', 'grok-4.5', 'claude-opus-5.5']).not.toContain(to);
    }
  });

  it('never routes a Grok call to the coding-agent model', () => {
    expect(findCheapestRoute('xAI', 1000, 'grok-4.3')).toBeNull();
    expect(findCheapestRoute('xAI', 1000, 'grok-4.6')).not.toBe('grok-build-0.1');
  });
});

describe('identifyModel prices the request it really names', () => {
  it('uses the exact entry for current models and real API IDs', () => {
    expect(identifyModel('claude-opus-5-5')).toBe('claude-opus-5.5');
    expect(getModel(identifyModel('claude-opus-5-5'))!.input).toBe(4);
    expect(identifyModel('gpt-6-luna')).toBe('gpt-6-luna');
    expect(identifyModel('claude-haiku-4-5-20251001')).toBe('claude-haiku-4.5');
  });
  it('falls back to the legacy family mapping for unknown versions', () => {
    expect(identifyModel('claude-opus-9-9')).toBe(normalizeModel('claude-opus-9-9'));
  });
});

describe('report() sends numbers only — never prompt content', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  it('posts exactly the documented fields', async () => {
    let sent: Record<string, unknown> = {};
    globalThis.fetch = (async (_u: string, init: { body: string }) => {
      sent = JSON.parse(init.body);
      return new Response(JSON.stringify({ fee_usd: 0, balance_remaining_usd: 20 }), { status: 200 });
    }) as unknown as typeof fetch;
    await report({ key: 'mcp_slash_test', tokens_estimated: 120, tokens_saved: 120, model: 'claude-opus-5', action: 'routed', cost_saved_usd: 0.01 } as never);
    expect(Object.keys(sent).sort()).toEqual(['action', 'cost_saved_usd', 'model', 'tokens_estimated', 'tokens_saved']);
    expect(JSON.stringify(sent)).not.toMatch(/content|prompt|messages/i);
  });
});
