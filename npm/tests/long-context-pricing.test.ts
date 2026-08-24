/**
 * WJTTC Long-Context Pricing Test Suite
 * =======================================
 * Regression guard for 2026-08-23: xAI bills the WHOLE request at a
 * higher rate once the prompt exceeds 200K tokens (confirmed against
 * docs.x.ai/docs/models). Both models.ts and preflight.ts modeled Grok's
 * context as a flat 1,000,000-token window with flat pricing, silently
 * under-costing any call between 200K and 1M tokens.
 *
 * Run: bun test tests/long-context-pricing.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { preflight } from '../src/index';
import { getModel, effectiveRate } from '../src/models';

describe('effectiveRate() — Grok long-context tier', () => {
  it('returns base rate at or below the 200K threshold', () => {
    const info = getModel('grok-4.20')!;
    const rate = effectiveRate(200_000, info);
    expect(rate.input).toBe(1.25);
    expect(rate.output).toBe(2.50);
  });

  it('SAFETY: returns the higher long-context rate above the 200K threshold', () => {
    const info = getModel('grok-4.20')!;
    const rate = effectiveRate(200_001, info);
    expect(rate.input).toBe(2.50);
    expect(rate.output).toBe(5.00);
  });

  it('does not apply a long-context tier to models that don\'t have one', () => {
    const info = getModel('claude-sonnet')!;
    const rate = effectiveRate(999_999, info);
    expect(rate.input).toBe(info.input);
    expect(rate.output).toBe(info.output);
  });
});

describe('preflight() — Grok long-context cost', () => {
  it('SAFETY: a >200K-token Grok call costs more than a flat-rate estimate would predict', () => {
    const bigContent = 'A'.repeat(3_000_000); // well over 200K tokens once estimated
    const result = preflight(bigContent, 'grok-4.20');
    // If the long-context tier were NOT applied (the pre-fix bug), cost
    // would be tokens/1e6 * 1.25 (base rate). With the tier applied
    // correctly, cost must be strictly higher for the same token count.
    const flatRateCost = Math.round(((result.tokens / 1_000_000) * 1.25) * 1_000_000) / 1_000_000;
    expect(result.tokens).toBeGreaterThan(200_000);
    expect(result.cost).toBeGreaterThan(flatRateCost);
  });
});
