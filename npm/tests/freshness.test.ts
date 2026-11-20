/**
 * WJTTC — price freshness alarm (scripts/check-freshness.ts). Fixed dates, so
 * this test never goes red by itself; the weekly workflow runs it on today.
 */
import { describe, it, expect } from 'bun:test';
import { freshnessProblems, MAX_AGE_DAYS, WARN_DAYS } from '../scripts/check-freshness';
import { CATALOG, MODELS } from '../src/index';

describe('freshness alarm', () => {
  it('the catalog is fresh on its own asOf date', () => {
    // Fresh except the one announced change: GPT-5.6 Sol's promotion ends 2026-11-30.
    expect(freshnessProblems(CATALOG, '2026-11-20')).toEqual(['gpt-5.6-sol: price holds until 2026-11-30 (10 days left)']);
  });

  it(`flags prices checked more than ${MAX_AGE_DAYS} days ago`, () => {
    const priced = Object.values(CATALOG).filter(e => !e.deprecated).length;
    const age = (today: string) => freshnessProblems(CATALOG, today).filter(p => p.includes('days ago'));
    // Prices checked 2026-11-20: 30 days old on 2026-12-20 (fine), 31 on 2026-12-21.
    expect(age('2026-12-20')).toEqual([]);
    expect(age('2026-12-21').length).toBe(priced);
    expect(age('2026-12-21')[0]).toContain('31 days ago');
  });

  it('skips deprecated entries (no longer priced by the provider)', () => {
    const retired = Object.entries(CATALOG).filter(([, e]) => e.deprecated).map(([k]) => k);
    expect(retired.sort()).toEqual(['gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-3.7-flash', 'grok-build-0.1', 'nemotron-3-super']);
    const flagged = freshnessProblems(CATALOG, '2027-06-01').map(p => p.split(':')[0]);
    for (const k of retired) expect(flagged).not.toContain(k);
  });

  it(`flags an announced price change ${WARN_DAYS} days out (Gemini 3.6–3.8 Flash, 2026-12-31)`, () => {
    const fresh = Object.fromEntries(Object.entries(CATALOG).map(([k, e]) => [k, { ...e, asOf: '2026-12-20' }]));
    const problems = freshnessProblems(fresh, '2026-12-20');
    expect(problems.map(p => p.split(':')[0]).sort()).toEqual(['gemini-3.6-flash', 'gemini-3.8-flash', 'gpt-5.6-sol']);
    expect(problems[0]).toContain('11 days left');
  });

  it('priceUntil stays out of MODELS (the proxy parity table)', () => {
    expect(MODELS['gemini-3.8-flash']).not.toHaveProperty('priceUntil');
    expect(CATALOG['gemini-3.8-flash'].priceUntil).toBe('2026-12-31');
  });
});
