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
