/**
 * WJTTC — quote() covers what the provider really bills: content plus the
 * chat template. Ground truth: real Nebius Token Factory calls recorded in
 * bench/results-nemotron-requests.json (2026-10-08). Content-only counting
 * quoted 12 tokens for a call billed 23; this keeps that from coming back.
 *
 * Run: bun test tests/request-framing.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { quote, reconcile, normalizeUsage } from '../src/index';
import { canonicalModel } from '../src/models';
import { FRAMING } from '../src/quote';

const recorded = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../bench/results-nemotron-requests.json'), 'utf8'));

describe('request framing — quotes never come in under a real Nebius bill', () => {
  for (const [apiId, cases] of Object.entries(recorded.models) as [string, any[]][]) {
    it(`${apiId}: every recorded request`, () => {
      const model = canonicalModel(apiId);
      for (const c of cases) {
        const q = quote({ input: c.messages, model, maxOutputTokens: 1 });
        expect([c.case, q.inputTokens >= c.prompt_tokens]).toEqual([c.case, true]);
        const r = reconcile(q, { prompt_tokens: c.prompt_tokens, completion_tokens: 1 });
        expect(r.underReported).toBe(false);
      }
    });
  }

  it('a string prompt is framed as one message', () => {
    const asString = quote({ input: 'Reply with the single word: ok', model: 'nemotron-3.5-lightning', maxOutputTokens: 1 });
    const asMessage = quote({ input: [{ role: 'user', content: 'Reply with the single word: ok' }], model: 'nemotron-3.5-lightning', maxOutputTokens: 1 });
    expect(asString.inputTokens).toBe(asMessage.inputTokens);
  });

  it('every provider in the catalog has framing; xAI carries its system preamble', () => {
    for (const p of ['Anthropic', 'OpenAI', 'xAI', 'Google', 'Nebius']) expect(FRAMING[p]).toBeDefined();
    expect(FRAMING.xAI.request).toBeGreaterThanOrEqual(193);
  });

  it('Nebius cache hits (prompt_cache_hit_tokens) are read', () => {
    expect(normalizeUsage({ prompt_tokens: 100, completion_tokens: 5, prompt_tokens_details: null, prompt_cache_hit_tokens: 64 }))
      .toEqual({ input: 100, output: 5, cached: 64, reasoning: 0 });
  });
});
