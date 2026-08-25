/**
 * WJTTC Slash-Tokens SDK Test Suite
 * ===================================
 * Championship-grade testing for the TypeScript SDK layer.
 * WASM engine has 172 tests (65 adversarial) in Zig.
 * This suite tests everything ABOVE the WASM: config, transact, imports.
 *
 * Run: bun test
 *
 * Covers:
 *   TIER 1 (BRAKE)  - Core estimation, exports, zero-dep guarantee
 *   TIER 2 (ENGINE) - Config/key resolution, report() error handling
 *   TIER 3 (AERO)   - Edge cases, adversarial inputs, precision
 *   TIER 4 (PIT STOP) - Live integration (optional, needs SLASH_KEY)
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { slash, slashBytes, init, report } from '../src/index';
import { resolveKey, getEndpoint } from '../src/config';

// Warm up WASM singleton before any tests run
beforeAll(() => {
  slash('warmup');
});

// ============================================================================
// TIER 1: BRAKE — Core Estimation & Exports
// "If these fail, nothing works"
// ============================================================================

describe('TIER 1: BRAKE — Core Estimation', () => {

  it('slash() returns a positive number for text', () => {
    const result = slash('Hello, world!');
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });

  it('slash() returns 0 for empty string', () => {
    expect(slash('')).toBe(0);
  });

  it('slashBytes() returns a positive number for bytes', () => {
    const bytes = new TextEncoder().encode('Hello, world!');
    const result = slashBytes(bytes);
    expect(result).toBeGreaterThan(0);
  });

  it('slashBytes() returns 0 for empty array', () => {
    expect(slashBytes(new Uint8Array(0))).toBe(0);
  });

  it('slash and slashBytes agree on same input', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const bytes = new TextEncoder().encode(text);
    expect(slash(text)).toBe(slashBytes(bytes));
  });

  it('all exports are functions', () => {
    expect(typeof slash).toBe('function');
    expect(typeof slashBytes).toBe('function');
    expect(typeof init).toBe('function');
    expect(typeof report).toBe('function');
  });

  it('estimation is sub-millisecond (after warmup)', () => {
    const text = 'A'.repeat(10000);
    // Warmup call to ensure WASM is initialized
    slash(text);
    // Now measure
    const start = performance.now();
    slash(text);
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(5); // Sub-5ms on any machine, typically <0.1ms
  });

  it('estimation is deterministic', () => {
    const text = 'Determinism test: same input always same output';
    const a = slash(text);
    const b = slash(text);
    const c = slash(text);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  describe('per-model calibration', () => {
    const text = 'A'.repeat(500);

    it('applies a known model\'s calibration factor (raises the raw estimate)', () => {
      const raw = slash(text);
      const calibrated = slash(text, 'claude-sonnet');
      expect(calibrated).toBeGreaterThan(raw);
    });

    it('SAFETY: an unrecognized model gets the safe fallback, never the raw (1.0) estimate', () => {
      // Regression guard for 2026-08-23: `CALIBRATION[model] ?? 1.0` silently
      // gave zero safety margin to any model not yet in the table — the most
      // dangerous case, worse than any model we'd actually measured. A new
      // model ID that isn't in CALIBRATION yet must still get a real margin.
      const raw = slash(text);
      const unknownModel = slash(text, 'some-brand-new-model-nobody-added-yet');
      expect(unknownModel).toBeGreaterThan(raw);
    });

    it('the unrecognized-model fallback matches the highest known calibration factor', () => {
      const known = slash(text, 'claude-sonnet');
      const unknown = slash(text, 'totally-unknown-model-xyz');
      expect(unknown).toBe(known);
    });

    it('Gemini, Grok, and GPT are calibrated too, not left on the raw estimate', () => {
      // Regression guard for 2026-08-23: Gemini and Grok were measured and
      // added to CALIBRATION the same day as the Claude fixes. GPT had a
      // calibration script from that same day but no table entry — it was
      // silently falling through to the unknown-model default (still safe,
      // just needlessly inflated) until the corpus expansion caught it.
      const raw = slash(text);
      expect(slash(text, 'gemini-3.1-pro')).toBeGreaterThan(raw);
      expect(slash(text, 'gemini-3.5-flash-lite')).toBeGreaterThan(raw);
      expect(slash(text, 'gemini-2.5-flash')).toBeGreaterThan(raw);
      expect(slash(text, 'grok-4.6')).toBeGreaterThan(raw);
      expect(slash(text, 'grok-4.3')).toBeGreaterThan(raw);
      expect(slash(text, 'grok-4.20')).toBeGreaterThan(raw);
      expect(slash(text, 'grok-4-1-fast')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.6-sol')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.6-terra')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.6-luna')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.4')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.4-mini')).toBeGreaterThan(raw);
      expect(slash(text, 'gpt-5.4-nano')).toBeGreaterThan(raw);
    });
  });
});

// ============================================================================
// TIER 2: ENGINE — Config & Key Resolution
// "The plumbing that connects estimation to revenue"
// ============================================================================

describe('TIER 2: ENGINE — Config & Key Resolution', () => {

  beforeEach(() => {
    // Reset config state between tests
    init({ key: '', endpoint: 'https://mcpaas.live/api/slash/transact' });
    delete process.env.SLASH_KEY;
  });

  describe('resolveKey() — three-layer resolution', () => {

    it('per-call key takes priority over everything', () => {
      init({ key: 'init_key' });
      process.env.SLASH_KEY = 'env_key';
      expect(resolveKey('per_call_key')).toBe('per_call_key');
    });

    it('init() key used when no per-call key', () => {
      init({ key: 'init_key' });
      process.env.SLASH_KEY = 'env_key';
      expect(resolveKey()).toBe('init_key');
    });

    it('env var used when no per-call or init key', () => {
      process.env.SLASH_KEY = 'env_key';
      expect(resolveKey()).toBe('env_key');
    });

    it('throws with clear message when no key anywhere', () => {
      expect(() => resolveKey()).toThrow('No Slash API key');
    });

    it('error message includes all three methods', () => {
      try {
        resolveKey();
      } catch (e: any) {
        expect(e.message).toContain('SLASH_KEY');
        expect(e.message).toContain('init({ key })');
        expect(e.message).toContain('report()');
      }
    });

    it('empty string init key falls through to env var', () => {
      init({ key: '' });
      process.env.SLASH_KEY = 'env_key';
      expect(resolveKey()).toBe('env_key');
    });
  });

  describe('init() — configuration', () => {

    it('sets custom endpoint', () => {
      init({ key: 'test', endpoint: 'http://localhost:8787/api/slash/transact' });
      expect(getEndpoint()).toBe('http://localhost:8787/api/slash/transact');
    });

    it('default endpoint is mcpaas.live', () => {
      init({ key: 'test' });
      expect(getEndpoint()).toBe('https://mcpaas.live/api/slash/transact');
    });

    it('can be called multiple times (last wins)', () => {
      init({ key: 'first' });
      init({ key: 'second' });
      expect(resolveKey()).toBe('second');
    });
  });

  describe('report() — error handling', () => {

    it('throws on missing key', async () => {
      expect(
        report({
          tokens_estimated: 100, tokens_saved: 100,
          action: 'skipped', cost_saved_usd: 0.01,
        })
      ).rejects.toThrow('No Slash API key');
    });

    it('throws on invalid key (401)', async () => {
      await expect(
        report({
          key: 'mcp_slash_fakefakefakefake',
          tokens_estimated: 100, tokens_saved: 100,
          action: 'skipped', cost_saved_usd: 0.01,
        })
      ).rejects.toThrow('Invalid Slash API key');
    }, 15000);

    it('model defaults to unknown when omitted', async () => {
      await expect(
        report({
          key: 'mcp_slash_fakefakefakefake',
          tokens_estimated: 100, tokens_saved: 100,
          action: 'skipped', cost_saved_usd: 0.01,
        })
      ).rejects.toThrow(); // Will throw 401, not a model error
    }, 15000);
  });
});

// ============================================================================
// TIER 3: AERO — Edge Cases & Adversarial Inputs
// "The TypeScript layer must not corrupt WASM results"
// ============================================================================

describe('TIER 3: AERO — Edge Cases', () => {

  describe('Estimation edge cases', () => {

    it('handles single character', () => {
      expect(slash('a')).toBeGreaterThanOrEqual(0);
    });

    it('handles very long input (100KB)', () => {
      const long = 'x'.repeat(100_000);
      const result = slash(long);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
      expect(Number.isFinite(result)).toBe(true);
    });

    it('SAFETY: does not silently truncate input above the old ~1.06MB WASM buffer ceiling', () => {
      // Regression guard for 2026-08-23: writeToMemory()/slashBytes() used
      // to silently cap input at the WASM module's initial memory and
      // estimate tokens only on that truncated prefix — no error, no
      // flag. Fixed by growing WASM linear memory on demand.
      //
      // The old ceiling was exactly buffer.length - WASM_INPUT_OFFSET - 1
      // = 1,114,112 - 4,096 - 1 = 1,110,015 bytes (confirmed empirically:
      // the shipped WASM module's initial memory is 17 pages = 1,114,112
      // bytes). Under the old code, ANY input at or beyond that ceiling
      // got truncated to exactly the same 1,110,015-byte slice — so two
      // different-sized inputs, both past the ceiling, produced the
      // IDENTICAL estimate. This test proves that's no longer true: this
      // exact assertion was verified to FAIL against the pre-fix source
      // (both estimates came out equal) before the fix, and pass after.
      const OLD_CEILING_BYTES = 1_114_112 - 4096 - 1;
      const atCeiling = slash('A'.repeat(OLD_CEILING_BYTES));
      const wellBeyondCeiling = slash('A'.repeat(OLD_CEILING_BYTES + 500_000));
      expect(wellBeyondCeiling).toBeGreaterThan(atCeiling);
    });

    it('handles CJK characters', () => {
      const result = slash('你好世界 こんにちは 안녕하세요');
      expect(result).toBeGreaterThan(0);
    });

    it('handles emoji', () => {
      const result = slash('🚀🏆⚡️🎯🔥💰');
      expect(result).toBeGreaterThan(0);
    });

    it('handles mixed content (code + prose + emoji)', () => {
      const mixed = `
        function hello() { return "world"; } // 🚀
        The quick brown fox jumps over the lazy dog.
        你好世界
        { "key": "value", "nested": { "deep": true } }
      `;
      const result = slash(mixed);
      expect(result).toBeGreaterThan(0);
    });

    it('handles all-whitespace', () => {
      expect(slash('   \n\t\r\n   ')).toBeGreaterThanOrEqual(0);
    });

    it('handles null bytes in string', () => {
      expect(slash('hello\x00world')).toBeGreaterThan(0);
    });

    it('handles JSON content', () => {
      const json = JSON.stringify({ users: [{ name: 'alice', age: 30 }], total: 1 });
      expect(slash(json)).toBeGreaterThan(0);
    });

    it('handles code content', () => {
      const code = `
        import { useState } from 'react';
        export default function App() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
        }
      `;
      expect(slash(code)).toBeGreaterThan(0);
    });

    it('longer input produces more tokens', () => {
      const short = 'Hello';
      const long = 'Hello '.repeat(100);
      expect(slash(long)).toBeGreaterThan(slash(short));
    });
  });

  describe('slashBytes edge cases', () => {

    it('handles binary data', () => {
      const binary = new Uint8Array([0x00, 0xFF, 0x80, 0x7F, 0x01, 0xFE]);
      const result = slashBytes(binary);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('handles large binary (64KB)', () => {
      const large = new Uint8Array(65536);
      for (let i = 0; i < large.length; i++) large[i] = i % 256;
      const result = slashBytes(large);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Report options validation', () => {

    it('accepts all three action types', () => {
      const actions: Array<'skipped' | 'reduced' | 'routed'> = ['skipped', 'reduced', 'routed'];
      for (const action of actions) {
        // Should not throw on action type — will throw on auth instead
        expect(
          report({
            key: 'mcp_slash_fake',
            tokens_estimated: 100, tokens_saved: 100,
            action, cost_saved_usd: 0.01,
          })
        ).rejects.toThrow();
      }
    });
  });
});

// ============================================================================
// TIER 4: PIT STOP — Live Integration (optional)
// Only runs if SLASH_KEY is set
// ============================================================================

// Capture before any beforeEach can clear it
const LIVE_KEY = process.env.SLASH_KEY;

describe.skipIf(!LIVE_KEY)('TIER 4: PIT STOP — Live Integration', () => {

  it('report() succeeds with real key', async () => {
    const result = await report({
      key: LIVE_KEY!,
      tokens_estimated: 50,
      tokens_saved: 50,
      model: 'wjttc-test',
      action: 'skipped',
      cost_saved_usd: 0.001,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
    expect(result.fee_usd).toBeGreaterThanOrEqual(0);
    expect(typeof result.balance_remaining_usd).toBe('number');
    expect(result.timestamp).toBeTruthy();
  });

  it('init() + report() works without per-call key', async () => {
    init({ key: LIVE_KEY! });
    const result = await report({
      tokens_estimated: 10,
      tokens_saved: 10,
      model: 'wjttc-init-test',
      action: 'routed',
      cost_saved_usd: 0.0001,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
  });
});
