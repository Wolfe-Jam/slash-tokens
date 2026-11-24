/**
 * WJTTC — a deprecated model is never a route target.
 *
 * decide(), preflightRoute() and slash-tokens/auto pick the cheapest model
 * that does the job. Before 1.8.3 nothing stopped them from picking a model
 * the provider no longer prices; it never happened only because those models
 * cost more. These tests make a deprecated model the cheapest option and
 * check it is still never chosen. Asking for one by name still works, and
 * decide() says it is deprecated.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { decide } from '../src/quote';
import { preflightRoute } from '../src/preflight';
import { findCheapestRoute } from '../src/intercept';
import { CATALOG } from '../src/catalog';
import { MODELS, isDeprecated } from '../src/models';
import { AUTO_ROUTE_TARGETS } from '../src/providers';

// Make `model` the cheapest in its provider, in both tables the routers read.
const saved: Array<() => void> = [];
function makeCheapest(model: string): void {
  const c = CATALOG[model] as { input: number; output: number };
  const m = MODELS[model];
  const before = { ci: c.input, co: c.output, mi: m.input, mo: m.output };
  c.input = m.input = 0.000001;
  c.output = m.output = 0.000001;
  saved.push(() => { c.input = before.ci; c.output = before.co; m.input = before.mi; m.output = before.mo; });
}
afterEach(() => { while (saved.length) saved.pop()!(); });

const TASK = { input: 'x'.repeat(4000), output: 500 };

describe('TIER 1: BRAKE — deprecated models are never route targets', () => {
  it('isDeprecated knows the retired models, and not the current ones', () => {
    expect(isDeprecated('gemini-3.1-pro')).toBe(true);
    expect(isDeprecated('gemini-3.7-flash')).toBe(true);
    expect(isDeprecated('gemini-3.1-pro-preview')).toBe(false);
    expect(isDeprecated('gemini-3.8-flash')).toBe(false);
    expect(isDeprecated('not-a-model')).toBe(false);
  });

  it('decide() never downgrades to a deprecated model, even the cheapest', () => {
    makeCheapest('gemini-3.7-flash');
    const d = decide({ ...TASK, model: 'gemini-3.8-flash' }, { allowOlder: true });
    expect(d.chosen?.model).not.toBe('gemini-3.7-flash');
  });

  it('preflightRoute() never suggests a deprecated model, even the cheapest', () => {
    makeCheapest('gemini-3.1-pro');
    const alt = preflightRoute('x'.repeat(4000), 'gemini-3.1-pro-preview');
    expect(alt?.model).not.toBe('gemini-3.1-pro');
  });

  it('slash-tokens/auto never rewrites a call to a deprecated model, even one in its frozen targets', () => {
    expect(AUTO_ROUTE_TARGETS.has('gemini-3.1-pro')).toBe(true); // the case this guards
    makeCheapest('gemini-3.1-pro');
    expect(findCheapestRoute('Google', 1000, 'gemini-3.1-pro-preview')).not.toBe('gemini-3.1-pro');
  });
});

describe('TIER 2: ENGINE — asking for a deprecated model by name', () => {
  it('decide() still answers, and the reason says it is deprecated', () => {
    const d = decide({ ...TASK, model: 'gemini-3.1-pro' });
    expect(d.requested.model).toBe('gemini-3.1-pro');
    expect(d.reason).toContain('gemini-3.1-pro is deprecated');
  });

  it('a current model carries no deprecation note', () => {
    expect(decide({ ...TASK, model: 'gemini-3.8-flash' }).reason).not.toContain('deprecated');
  });
});
