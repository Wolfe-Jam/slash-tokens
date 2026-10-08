/**
 * WJTTC — price freshness alarm (scripts/check-freshness.ts). Fixed dates, so
 * this test never goes red by itself; the weekly workflow runs it on today.
 */
import { describe, it, expect } from 'bun:test';
import { freshnessProblems, MAX_AGE_DAYS, WARN_DAYS } from '../scripts/check-freshness';
import { CATALOG, MODELS } from '../src/index';

describe('freshness alarm', () => {
  it('the catalog is fresh on its own asOf date', () => {
    expect(freshnessProblems(CATALOG, '2026-10-08')).toEqual([]);
  });

  it(`flags prices checked more than ${MAX_AGE_DAYS} days ago`, () => {
    const problems = freshnessProblems(CATALOG, '2026-11-07');
    expect(problems.length).toBe(Object.keys(CATALOG).length);
    expect(problems[0]).toContain('31 days ago');
  });

  it(`flags an announced price change ${WARN_DAYS} days out (Gemini 3.6–3.8 Flash, 2026-12-31)`, () => {
    const fresh = Object.fromEntries(Object.entries(CATALOG).map(([k, e]) => [k, { ...e, asOf: '2026-12-20' }]));
    const problems = freshnessProblems(fresh, '2026-12-20');
    expect(problems.map(p => p.split(':')[0]).sort()).toEqual(['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']);
    expect(problems[0]).toContain('11 days left');
  });

  it('priceUntil stays out of MODELS (the proxy parity table)', () => {
    expect(MODELS['gemini-3.8-flash']).not.toHaveProperty('priceUntil');
    expect(CATALOG['gemini-3.8-flash'].priceUntil).toBe('2026-12-31');
  });
});
