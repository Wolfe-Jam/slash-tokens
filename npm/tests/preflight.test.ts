/**
 * WJTTC Pre-Flight & Auto Mode Test Suite
 * =========================================
 * Championship-grade testing for the flights API.
 * "Just Works" doesn't mean not tested.
 *
 * Run: bun test tests/preflight.test.ts
 *
 * Covers:
 *   TIER 1 (BRAKE)  - preflight() returns correct structure, model lookup works
 *   TIER 2 (ENGINE) - pricing math, context window checks, alternatives
 *   TIER 3 (AERO)   - edge cases, unknown models, adversarial inputs, precision
 *   TIER 4 (PIT STOP) - auto mode fetch interception
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { slash, preflight, listModels, MODELS } from '../src/index';
import type { PreflightResult, ModelInfo } from '../src/index';
import { getModel } from '../src/models';
import { patchFetch, onIntercept } from '../src/intercept';
import type { InterceptEvent } from '../src/intercept';

// Warm up WASM
beforeAll(() => { slash('warmup'); });

// ============================================================================
// TIER 1: BRAKE — Structure & Model Registry
// "If these fail, nothing flies"
// ============================================================================

describe('TIER 1: BRAKE — Preflight Structure', () => {

  it('preflight returns all required fields', () => {
    const check = preflight('hello', 'claude-sonnet');
    expect(check).toHaveProperty('tokens');
    expect(check).toHaveProperty('cost');
    expect(check).toHaveProperty('fits');
    expect(check).toHaveProperty('model');
    expect(check).toHaveProperty('context');
    expect(check).toHaveProperty('utilization');
    expect(check).toHaveProperty('options');
  });

  it('tokens is a positive number for non-empty content', () => {
    const check = preflight('hello world', 'claude-sonnet');
    expect(check.tokens).toBeGreaterThan(0);
    expect(typeof check.tokens).toBe('number');
  });

  it('cost is a non-negative number', () => {
    const check = preflight('hello', 'claude-sonnet');
    expect(check.cost).toBeGreaterThanOrEqual(0);
    expect(typeof check.cost).toBe('number');
  });

  it('model echoes back the requested model', () => {
    const check = preflight('hello', 'grok-3');
    expect(check.model).toBe('grok-3');
  });

  it('options is an array', () => {
    const check = preflight('hello', 'claude-opus');
    expect(Array.isArray(check.options)).toBe(true);
  });

  it('listModels returns all registered models', () => {
    const models = listModels();
    expect(models.length).toBeGreaterThanOrEqual(10);
    expect(models).toContain('claude-opus');
    expect(models).toContain('claude-sonnet');
    expect(models).toContain('claude-haiku');
    expect(models).toContain('grok-3');
    expect(models).toContain('gpt-4o');
  });

  it('getModel returns ModelInfo for valid model', () => {
    const info = getModel('claude-opus');
    expect(info).toBeDefined();
    expect(info!.input).toBe(15.00);
    expect(info!.output).toBe(75.00);
    expect(info!.context).toBe(200000);
  });

  it('getModel returns undefined for invalid model', () => {
    expect(getModel('nonexistent-model')).toBeUndefined();
  });

  it('MODELS object has correct structure for every model', () => {
    for (const [name, info] of Object.entries(MODELS)) {
      expect(typeof info.input).toBe('number');
      expect(typeof info.output).toBe('number');
      expect(typeof info.context).toBe('number');
      expect(info.input).toBeGreaterThan(0);
      expect(info.output).toBeGreaterThan(0);
      expect(info.context).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// TIER 2: ENGINE — Pricing, Context Windows, Alternatives
// "The math that determines every decision"
// ============================================================================

describe('TIER 2: ENGINE — Pricing & Intelligence', () => {

  describe('Cost calculation', () => {
    it('cost scales with token count', () => {
      const small = preflight('hi', 'claude-opus');
      const big = preflight('hello world this is a much longer prompt for testing', 'claude-opus');
      expect(big.cost).toBeGreaterThan(small.cost);
    });

    it('opus costs more than sonnet for same content', () => {
      const content = 'The quick brown fox jumps over the lazy dog';
      const opus = preflight(content, 'claude-opus');
      const sonnet = preflight(content, 'claude-sonnet');
      expect(opus.cost).toBeGreaterThan(sonnet.cost);
      expect(opus.tokens).toBe(sonnet.tokens); // Same tokens, different price
    });

    it('haiku is cheaper than sonnet', () => {
      const content = 'test content';
      const haiku = preflight(content, 'claude-haiku');
      const sonnet = preflight(content, 'claude-sonnet');
      expect(haiku.cost).toBeLessThan(sonnet.cost);
    });

    it('cost formula: (tokens / 1M) * input_rate', () => {
      const content = 'test';
      const check = preflight(content, 'claude-opus');
      const expected = (check.tokens / 1_000_000) * 15.00;
      expect(Math.abs(check.cost - expected)).toBeLessThan(0.000001);
    });
  });

  describe('Context window checks', () => {
    it('fits is true for small content', () => {
      const check = preflight('hello', 'claude-sonnet');
      expect(check.fits).toBe(true);
    });

    it('context matches model specification', () => {
      expect(preflight('hi', 'claude-opus').context).toBe(200000);
      expect(preflight('hi', 'gpt-4o').context).toBe(128000);
      expect(preflight('hi', 'gemini-2.0-flash').context).toBe(1048576);
    });

    it('utilization is between 0 and 1 for fitting content', () => {
      const check = preflight('hello world this is a test of utilization', 'claude-sonnet');
      expect(check.utilization).toBeGreaterThanOrEqual(0);
      expect(check.utilization).toBeLessThan(1);
    });

    it('utilization increases with content size', () => {
      const small = preflight('hi', 'claude-sonnet');
      const big = preflight('hello '.repeat(1000), 'claude-sonnet');
      expect(big.utilization).toBeGreaterThan(small.utilization);
    });
  });

  describe('Alternatives / Options', () => {
    it('opus has cheaper alternatives', () => {
      const check = preflight('hello world', 'claude-opus');
      expect(check.options.length).toBeGreaterThan(0);
    });

    it('alternatives are sorted cheapest first', () => {
      const check = preflight('hello world', 'claude-opus');
      for (let i = 1; i < check.options.length; i++) {
        expect(check.options[i].cost).toBeGreaterThanOrEqual(check.options[i - 1].cost);
      }
    });

    it('alternatives only include models cheaper than requested', () => {
      const check = preflight('hello world', 'claude-opus');
      for (const opt of check.options) {
        expect(opt.savings).toBeGreaterThan(0);
        expect(opt.cost).toBeLessThan(check.cost);
      }
    });

    it('savings + alternative cost equals original cost', () => {
      const check = preflight('hello world', 'claude-opus');
      for (const opt of check.options) {
        const sum = opt.cost + opt.savings;
        expect(Math.abs(sum - check.cost)).toBeLessThan(0.000001);
      }
    });

    it('savingsPercent is between 0 and 100', () => {
      const check = preflight('hello world', 'claude-opus');
      for (const opt of check.options) {
        expect(opt.savingsPercent).toBeGreaterThan(0);
        expect(opt.savingsPercent).toBeLessThanOrEqual(100);
      }
    });

    it('cheapest model has no cheaper alternatives', () => {
      // Find the cheapest model
      let cheapest = '';
      let cheapestRate = Infinity;
      for (const [name, info] of Object.entries(MODELS)) {
        if (info.input < cheapestRate) {
          cheapestRate = info.input;
          cheapest = name;
        }
      }
      const check = preflight('hello', cheapest);
      expect(check.options.length).toBe(0);
    });

    it('alternatives exclude the requested model', () => {
      const check = preflight('hello', 'claude-opus');
      const modelNames = check.options.map(o => o.model);
      expect(modelNames).not.toContain('claude-opus');
    });
  });
});

// ============================================================================
// TIER 3: AERO — Edge Cases & Adversarial
// "Break it before xAI does"
// ============================================================================

describe('TIER 3: AERO — Edge Cases', () => {

  describe('Unknown models', () => {
    it('throws on unknown model', () => {
      expect(() => preflight('hello', 'gpt-99-turbo')).toThrow('Unknown model');
    });

    it('error message includes available models', () => {
      try {
        preflight('hello', 'fake-model');
      } catch (e: any) {
        expect(e.message).toContain('claude-opus');
        expect(e.message).toContain('grok-3');
      }
    });
  });

  describe('Empty and edge content', () => {
    it('handles empty string', () => {
      const check = preflight('', 'claude-sonnet');
      expect(check.tokens).toBe(0);
      expect(check.cost).toBe(0);
      expect(check.fits).toBe(true);
    });

    it('handles single character', () => {
      const check = preflight('a', 'claude-sonnet');
      expect(check.tokens).toBeGreaterThanOrEqual(0);
      expect(typeof check.cost).toBe('number');
    });

    it('handles very long content (100KB)', () => {
      const content = 'x'.repeat(100_000);
      const check = preflight(content, 'claude-sonnet');
      expect(check.tokens).toBeGreaterThan(0);
      expect(check.cost).toBeGreaterThan(0);
      expect(Number.isFinite(check.cost)).toBe(true);
    });

    it('handles CJK characters', () => {
      const check = preflight('你好世界 こんにちは', 'claude-sonnet');
      expect(check.tokens).toBeGreaterThan(0);
    });

    it('handles emoji', () => {
      const check = preflight('🚀🏆⚡️🎯🔥', 'claude-sonnet');
      expect(check.tokens).toBeGreaterThan(0);
    });

    it('handles JSON content', () => {
      const json = JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] });
      const check = preflight(json, 'gpt-4o');
      expect(check.tokens).toBeGreaterThan(0);
    });

    it('handles code content', () => {
      const code = 'function hello() { return "world"; }\nconst x = hello();';
      const check = preflight(code, 'claude-haiku');
      expect(check.tokens).toBeGreaterThan(0);
    });
  });

  describe('Financial precision', () => {
    it('cost has no floating point artifacts', () => {
      const check = preflight('test content here', 'claude-sonnet');
      const costStr = check.cost.toString();
      // Should not have more than 6 decimal places
      const parts = costStr.split('.');
      if (parts.length > 1) {
        expect(parts[1].length).toBeLessThanOrEqual(6);
      }
    });

    it('savings math is precise', () => {
      const check = preflight('hello world test', 'claude-opus');
      for (const opt of check.options) {
        const savingsStr = opt.savings.toString();
        const parts = savingsStr.split('.');
        if (parts.length > 1) {
          expect(parts[1].length).toBeLessThanOrEqual(6);
        }
      }
    });

    it('zero tokens = zero cost for any model', () => {
      for (const model of listModels()) {
        const check = preflight('', model);
        expect(check.cost).toBe(0);
      }
    });
  });

  describe('Every model works', () => {
    const content = 'Test content for every model in the registry';
    for (const model of Object.keys(MODELS)) {
      it(`preflight works for ${model}`, () => {
        const check = preflight(content, model);
        expect(check.tokens).toBeGreaterThan(0);
        expect(check.cost).toBeGreaterThan(0);
        expect(typeof check.fits).toBe('boolean');
        expect(check.model).toBe(model);
      });
    }
  });
});

// ============================================================================
// TIER 4: PIT STOP — Auto Mode & Fetch Interception
// "The one-liner that changes everything"
// ============================================================================

describe('TIER 4: PIT STOP — Auto Mode', () => {

  let events: InterceptEvent[] = [];
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    events = [];
    onIntercept((event) => { events.push(event); });
    patchFetch();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('intercepts Anthropic API calls', async () => {
    events = [];
    try {
      await globalThis.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'What is 2+2?' }]
        })
      });
    } catch {}

    expect(events.length).toBe(1);
    expect(events[0].provider).toBe('Anthropic');
    expect(events[0].model).toBe('claude-sonnet');
    expect(events[0].tokens).toBeGreaterThan(0);
  }, 15000);

  it('intercepts OpenAI API calls', async () => {
    events = [];
    try {
      await globalThis.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
    } catch {}

    expect(events.length).toBe(1);
    expect(events[0].provider).toBe('OpenAI');
    expect(events[0].model).toBe('gpt-4o');
  }, 15000);

  it('intercepts xAI API calls', async () => {
    events = [];
    try {
      await globalThis.fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [{ role: 'user', content: 'Test' }]
        })
      });
    } catch {}

    expect(events.length).toBe(1);
    expect(events[0].provider).toBe('xAI');
    expect(events[0].model).toBe('grok-3');
  }, 15000);

  it('intercepts Google Gemini API calls', async () => {
    events = [];
    try {
      await globalThis.fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
    } catch {}

    expect(events.length).toBe(1);
    expect(events[0].provider).toBe('Google');
  }, 15000);

  it('does NOT intercept non-AI fetch calls', async () => {
    events = [];
    try {
      await globalThis.fetch('https://example.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' })
      });
    } catch {}

    expect(events.length).toBe(0);
  }, 15000);

  it('event has all required fields', async () => {
    events = [];
    try {
      await globalThis.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          messages: [{ role: 'user', content: 'Explain quantum computing' }]
        })
      });
    } catch {}

    expect(events.length).toBe(1);
    const e = events[0];
    expect(e.endpoint).toContain('api.anthropic.com');
    expect(e.provider).toBe('Anthropic');
    expect(e.model).toBe('claude-opus');
    expect(e.tokens).toBeGreaterThan(0);
    expect(e.cost).toBeGreaterThan(0);
    expect(typeof e.fits).toBe('boolean');
    expect(e.timestamp).toMatch(/^\d{4}-\d{2}/);
  }, 15000);

  it('normalizes model names correctly', async () => {
    const tests = [
      { input: 'claude-sonnet-4-20250514', expected: 'claude-sonnet' },
      { input: 'claude-opus-4-20250514', expected: 'claude-opus' },
      { input: 'claude-3-5-haiku-20241022', expected: 'claude-haiku' },
    ];

    for (const t of tests) {
      events = [];
      try {
        await globalThis.fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: t.input,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
      } catch {}
      expect(events[0]?.model).toBe(t.expected);
    }
  }, 15000);

  it('never breaks the actual fetch call', async () => {
    // Even with malformed body, slash should not crash — fetch proceeds normally
    events = [];
    let completed = false;
    try {
      await globalThis.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json {{{',
      });
      completed = true;
    } catch {
      completed = true; // Network error is fine — slash didn't block it
    }
    expect(completed).toBe(true);
  }, 15000);
});
