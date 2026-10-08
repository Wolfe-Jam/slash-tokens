/**
 * WJTTC — Catalog · quote() · decide()  (1.7.0)
 *
 * Run: bun test tests/quote-decide.test.ts
 *
 *   TIER 1 (BRAKE)  - the catalog is one coherent source (MODELS, groups, tiers)
 *   TIER 2 (ENGINE) - quote() math: input, output band, long-context rate, fit
 *   TIER 3 (AERO)   - decide(): floor, budget, never cross-provider, never dearer
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import {
  slash, quote, decide, init, CATALOG, TIER_NAMES, MODELS, PROVIDER_MODELS,
  DEFAULT_MAX_OUTPUT_TOKENS,
} from '../src/index';
import { canonicalModel } from '../src/models';
import { NOT_ROUTE_TARGETS } from '../src/providers';

beforeAll(() => {
  slash('warmup');
  init({ route: true, models: Object.keys(MODELS) });
});

const PRICE_FIELDS = ['input', 'output', 'context', 'longContextThreshold', 'longContextInput', 'longContextOutput'] as const;

describe('TIER 1: BRAKE — one catalog', () => {
  it('MODELS has exactly the catalog keys, in catalog order', () => {
    expect(Object.keys(MODELS)).toEqual(Object.keys(CATALOG));
  });

  it('MODELS carries only price fields, equal to the catalog', () => {
    for (const [name, info] of Object.entries(MODELS)) {
      expect(Object.keys(info).every(k => (PRICE_FIELDS as readonly string[]).includes(k))).toBe(true);
      for (const f of PRICE_FIELDS) expect([name, f, (info as any)[f]]).toEqual([name, f, (CATALOG[name] as any)[f]]);
    }
  });

  it('every catalog model sits in exactly one provider group, the one it names', () => {
    for (const [name, entry] of Object.entries(CATALOG)) {
      const groups = Object.entries(PROVIDER_MODELS).filter(([, ms]) => ms.includes(name)).map(([p]) => p);
      expect([name, groups]).toEqual([name, [entry.provider]]);
    }
  });

  it('every grouped model is in the catalog', () => {
    for (const ms of Object.values(PROVIDER_MODELS)) for (const m of ms) expect(CATALOG[m]).toBeDefined();
  });

  it('tiers are 1–4 and named; asOf is a date', () => {
    for (const entry of Object.values(CATALOG)) {
      expect([1, 2, 3, 4]).toContain(entry.tier);
      expect(TIER_NAMES[entry.tier]).toBeTruthy();
      expect(entry.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('Nemotron is priced on Nebius', () => {
    expect(CATALOG['nemotron-3-ultra']).toMatchObject({ provider: 'Nebius', tier: 3, input: 1.00, output: 3.00 });
    expect(CATALOG['nemotron-3-super']).toMatchObject({ provider: 'Nebius', tier: 2, input: 0.30, output: 0.90 });
    expect(CATALOG['nemotron-3-nano']).toMatchObject({ provider: 'Nebius', tier: 1, input: 0.06, output: 0.24 });
    expect(CATALOG['nemotron-3.5-lightning']).toMatchObject({ provider: 'Nebius', tier: 1, input: 0.06, output: 0.24 });
  });

  it('Nebius API IDs resolve to catalog keys', () => {
    expect(canonicalModel('nvidia/Nemotron-3_5-Lightning')).toBe('nemotron-3.5-lightning');
    expect(canonicalModel('nvidia/nemotron-3-super-120b-a12b')).toBe('nemotron-3-super');
    expect(canonicalModel('nvidia/Nemotron-3-Ultra-550b-a55b')).toBe('nemotron-3-ultra');
  });
});

describe('TIER 2: ENGINE — quote()', () => {
  const prompt = 'Refactor the parser so empty slots score zero and add a test for it.';

  it('counts input with the model calibration and prices the output band', () => {
    const q = quote({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 2000, minOutputTokens: 500 });
    const n = slash(prompt, 'nemotron-3-ultra');
    expect(q.inputTokens).toBe(n);
    expect(q.outputTokens).toEqual({ min: 500, max: 2000 });
    expect(q.cost.low).toBeCloseTo((n * 1.00 + 500 * 3.00) / 1e6, 6);
    expect(q.cost.high).toBeCloseTo((n * 1.00 + 2000 * 3.00) / 1e6, 6);
    expect(q).toMatchObject({ model: 'nemotron-3-ultra', provider: 'Nebius', tier: 3, outputAssumed: false, fits: true, asOf: '2026-10-07' });
  });

  it('says when it assumed the output ceiling', () => {
    const q = quote({ input: prompt, model: 'claude-haiku-4.5' });
    expect(q.outputAssumed).toBe(true);
    expect(q.outputTokens).toEqual({ min: 0, max: DEFAULT_MAX_OUTPUT_TOKENS });
    expect(q.cost.low).toBeLessThan(q.cost.high);
  });

  it('accepts real API IDs and returns the canonical key', () => {
    expect(quote({ input: prompt, model: 'claude-opus-4-7' }).model).toBe('claude-opus-4.7');
  });

  it('chat messages cost their content plus framing', () => {
    const msgs = [{ role: 'system', content: 'You are terse.' }, { role: 'user', content: prompt }];
    const q = quote({ input: msgs, model: 'gpt-5.4' });
    const content = slash('You are terse.', 'gpt-5.4') + slash(prompt, 'gpt-5.4');
    expect(q.inputTokens).toBeGreaterThan(content);
  });

  it('min output never exceeds max', () => {
    const q = quote({ input: prompt, model: 'gpt-5.4', maxOutputTokens: 100, minOutputTokens: 900 });
    expect(q.outputTokens).toEqual({ min: 100, max: 100 });
  });

  it('applies the long-context rate past the threshold', () => {
    const big = 'word '.repeat(220_000);
    const q = quote({ input: big, model: 'grok-4.6', maxOutputTokens: 0 });
    expect(q.inputTokens).toBeGreaterThan(200_000);
    expect(q.cost.high).toBeCloseTo((q.inputTokens * 4.00) / 1e6, 6);
  });

  it('flags a job that will not fit (input + max output)', () => {
    const q = quote({ input: prompt, model: 'gpt-5.4-mini', maxOutputTokens: 200_000 });
    expect(q.fits).toBe(false);
  });

  it('throws on an unknown model, like preflight()', () => {
    expect(() => quote({ input: prompt, model: 'gpt-99' })).toThrow('Unknown model');
  });
});

describe('TIER 3: AERO — decide()', () => {
  const task = { input: 'Write the release notes for this diff.', maxOutputTokens: 1500 };

  it('default floor = the requested tier: a cheaper same-tier model wins', () => {
    const d = decide({ ...task, model: 'claude-opus-4.8' });
    expect(d.action).toBe('downgrade');
    expect(d.chosen?.model).toBe('claude-opus-5.5');
    expect(d.chosen?.tier).toBe(3);
    expect(d.saved).toBeCloseTo(d.requested.cost.high - d.chosen!.cost.high, 6);
  });

  it('go when the requested model is already the cheapest at its tier', () => {
    const d = decide({ ...task, model: 'claude-opus-5.5' });
    expect(d.action).toBe('go');
    expect(d.chosen).toBe(d.requested);
    expect(d.saved).toBe(0);
  });

  it('a lower floor lets it book a smaller line (Ultra → Lightning)', () => {
    const d = decide({ ...task, model: 'nemotron-3-ultra' }, { floor: 1 });
    expect(d.action).toBe('downgrade');
    expect(d.chosen?.model).toBe('nemotron-3.5-lightning');
  });

  it('floor 2 stops at Super', () => {
    const d = decide({ ...task, model: 'nemotron-3-ultra' }, { floor: 2 });
    expect(d.chosen?.model).toBe('nemotron-3-super');
  });

  it('a budget the requested model breaks forces a cheaper model', () => {
    const ultra = quote({ ...task, model: 'nemotron-3-ultra' });
    const d = decide({ ...task, model: 'nemotron-3-ultra' }, { floor: 2, budget: ultra.cost.high / 2 });
    expect(d.action).toBe('downgrade');
    expect(d.chosen!.cost.high).toBeLessThanOrEqual(ultra.cost.high / 2);
    expect(d.reason).toContain("doesn't fit the budget");
  });

  it('block when nothing at or above the floor fits the budget', () => {
    const d = decide({ ...task, model: 'nemotron-3-ultra' }, { floor: 3, budget: 0.000001 });
    expect(d.action).toBe('block');
    expect(d.chosen).toBeNull();
    expect(d.reason).toContain('budget');
  });

  it('never raises the bill: a model that does not fit is blocked, not upgraded', () => {
    // Haiku (200K) is Anthropic's cheapest; every model that fits costs more.
    const d = decide({ input: 'x', model: 'claude-haiku-4.5', maxOutputTokens: 300_000 }, { floor: 1 });
    expect(d.action).toBe('block');
    expect(d.reason).toContain("can't fit");
  });

  it('a floor above the requested model keeps the requested model', () => {
    const d = decide({ ...task, model: 'claude-haiku-4.5' }, { floor: 3 });
    expect(d.action).toBe('go');
  });

  it('never leaves the provider, never books a NOT_ROUTE_TARGETS model, never costs more', () => {
    for (const model of Object.keys(CATALOG)) {
      const d = decide({ ...task, model }, { floor: 1 });
      if (!d.chosen) continue;
      expect([model, d.chosen.provider]).toEqual([model, CATALOG[model].provider]);
      if (d.chosen.model !== d.requested.model) {
        expect(NOT_ROUTE_TARGETS.has(d.chosen.model)).toBe(false);
        expect(d.chosen.cost.high).toBeLessThan(d.requested.cost.high);
      }
    }
  });

  it('init({ route: false }) means go or block only', () => {
    init({ route: false });
    try {
      expect(decide({ ...task, model: 'claude-opus-4.8' }, { floor: 1 }).action).toBe('go');
    } finally {
      init({ route: true });
    }
  });

  it('init({ models }) excludes substitutes', () => {
    init({ models: ['nemotron-3-ultra', 'nemotron-3-super'] });
    try {
      expect(decide({ ...task, model: 'nemotron-3-ultra' }, { floor: 1 }).chosen?.model).toBe('nemotron-3-super');
    } finally {
      init({ models: Object.keys(MODELS) });
    }
  });
});
