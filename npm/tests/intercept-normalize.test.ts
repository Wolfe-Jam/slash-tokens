/**
 * WJTTC intercept.ts normalizeModel() Test Suite
 * =================================================
 * Regression guard for 2026-08-23: this local copy of normalizeModel()
 * (kept in sync by hand with mcpaas-cf's src/slash-models.ts — no shared
 * import between the two repos) was missing the opus-4.7 special case
 * and several OpenAI legacy fallbacks the other copy already had. A
 * mismatch here means a real intercepted call gets mapped to the wrong
 * internal key, which flows into the WRONG calibration factor and the
 * wrong reported cost — previously untested since normalizeModel() was
 * not exported and only reachable indirectly via live network tests.
 *
 * Run: bun test tests/intercept-normalize.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { normalizeModel } from '../src/intercept';

describe('intercept.ts normalizeModel — current models', () => {
  it('claude-opus-4-20250514 → claude-opus', () => {
    expect(normalizeModel('claude-opus-4-20250514')).toBe('claude-opus');
  });
  it('claude-opus-4-7 → claude-opus-4.7 (specific, not generic opus)', () => {
    expect(normalizeModel('claude-opus-4-7')).toBe('claude-opus-4.7');
  });
  it('claude-opus-4.7 → claude-opus-4.7', () => {
    expect(normalizeModel('claude-opus-4.7')).toBe('claude-opus-4.7');
  });
  it('claude-sonnet-5 → claude-sonnet', () => {
    expect(normalizeModel('claude-sonnet-5')).toBe('claude-sonnet');
  });
  it('claude-haiku-4-5-20251001 → claude-haiku', () => {
    expect(normalizeModel('claude-haiku-4-5-20251001')).toBe('claude-haiku');
  });
});

describe('intercept.ts normalizeModel — legacy OpenAI names', () => {
  it('gpt-4-turbo → gpt-5.4', () => {
    expect(normalizeModel('gpt-4-turbo')).toBe('gpt-5.4');
  });
  it('gpt-4 → gpt-5.4', () => {
    expect(normalizeModel('gpt-4')).toBe('gpt-5.4');
  });
  it('gpt-3.5-turbo → gpt-5.4-nano', () => {
    expect(normalizeModel('gpt-3.5-turbo')).toBe('gpt-5.4-nano');
  });
  it('gpt-4o → gpt-5.4', () => {
    expect(normalizeModel('gpt-4o')).toBe('gpt-5.4');
  });
  it('gpt-4o-mini → gpt-5.4-mini', () => {
    expect(normalizeModel('gpt-4o-mini')).toBe('gpt-5.4-mini');
  });
  it('o1 → gpt-5.4', () => {
    expect(normalizeModel('o1')).toBe('gpt-5.4');
  });
  it('o1-mini → gpt-5.4-mini', () => {
    expect(normalizeModel('o1-mini')).toBe('gpt-5.4-mini');
  });
});

describe('intercept.ts normalizeModel — xAI/Google', () => {
  it('grok-3 → grok-4.20', () => {
    expect(normalizeModel('grok-3')).toBe('grok-4.20');
  });
  it('grok-4-1-fast → grok-4-1-fast', () => {
    expect(normalizeModel('grok-4-1-fast')).toBe('grok-4-1-fast');
  });
  it('gemini-2.0-flash → gemini-2.5-flash', () => {
    expect(normalizeModel('gemini-2.0-flash')).toBe('gemini-2.5-flash');
  });
});

describe('intercept.ts normalizeModel — parity with mcpaas-cf', () => {
  it('SAFETY: mirrors mcpaas-cf slash-models.ts normalizeModel exactly for every case tested there', () => {
    // Cross-repo parity check — if these two copies ever silently drift,
    // the same raw model string produces a different internal key
    // depending on which side of the proxy handles it, and therefore a
    // different calibration factor and reported cost for the identical
    // real call. Mirrors mcpaas-cf/tests/wjttc/slash-models.test.ts's
    // full case list exactly.
    const cases: Array<[string, string]> = [
      ['claude-opus-4-20250514', 'claude-opus'],
      ['claude-sonnet-4-20250514', 'claude-sonnet'],
      ['claude-haiku-4-5-20251001', 'claude-haiku'],
      ['gpt-5.4', 'gpt-5.4'],
      ['gpt-5.4-mini', 'gpt-5.4-mini'],
      ['gpt-5.4-nano', 'gpt-5.4-nano'],
      ['grok-4.20', 'grok-4.20'],
      ['grok-4-1-fast', 'grok-4-1-fast'],
      ['gemini-3.1-pro', 'gemini-3.1-pro'],
      ['gemini-2.5-flash', 'gemini-2.5-flash'],
      ['gpt-4-turbo', 'gpt-5.4'],
      ['gpt-4', 'gpt-5.4'],
      ['gpt-3.5-turbo', 'gpt-5.4-nano'],
      ['gpt-4o', 'gpt-5.4'],
      ['gpt-4o-mini', 'gpt-5.4-mini'],
      ['o1', 'gpt-5.4'],
      ['o1-mini', 'gpt-5.4-mini'],
      ['grok-3', 'grok-4.20'],
      ['claude-3.5-sonnet', 'claude-sonnet'],
      ['claude-3-opus', 'claude-opus'],
      ['claude-3-haiku', 'claude-haiku'],
    ];
    for (const [input, expected] of cases) {
      expect(normalizeModel(input)).toBe(expected);
    }
  });
});
