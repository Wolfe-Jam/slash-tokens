/**
 * WJTTC — WASM memory: a big input must not change later estimates (fixed 2026-10-07)
 *
 * Input used to be written from byte 4096 up. Anything over ~1.04 MB ran over
 * the module's stack and lookup tables (1,048,576+), and every later estimate
 * in that process was wrong. Input now starts above them.
 *
 * Run: bun test tests/wasm-memory.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { slash, slashBytes } from '../src/index';
import { getInstance, WASM_INPUT_OFFSET } from '../src/wasm';

const PROMPTS = [
  'Add a unit test for the empty-slot case and fix the off-by-one in the scorer.',
  '{"a": [1,2,3], "b": {"c": null}}',
  'SELECT * FROM t WHERE x = 1;',
  'Hola, ¿cómo estás? Esto es una prueba.',
];

describe('WASM memory — big inputs leave no trace', () => {
  it('input is written above the stack and the lookup tables', () => {
    expect(WASM_INPUT_OFFSET).toBeGreaterThanOrEqual(1_049_916);
  });

  for (const [label, big] of [
    ['1.2 MB of ASCII', 'A'.repeat(1_200_000)],
    ['3 MB of ASCII', 'word '.repeat(600_000)],
    ['3.6 MB of CJK', '中'.repeat(1_200_000)],
  ] as const) {
    it(`estimates are unchanged after ${label}`, () => {
      const before = PROMPTS.map(p => slash(p));
      const beforeModel = PROMPTS.map(p => slash(p, 'claude-opus-5'));
      expect(slash(big)).toBeGreaterThan(100_000);
      expect(PROMPTS.map(p => slash(p))).toEqual(before);
      expect(PROMPTS.map(p => slash(p, 'claude-opus-5'))).toEqual(beforeModel);
    });
  }

  it('slashBytes takes the same path', () => {
    const enc = new TextEncoder();
    const before = PROMPTS.map(p => slashBytes(enc.encode(p)));
    slashBytes(enc.encode('B'.repeat(1_500_000)));
    expect(PROMPTS.map(p => slashBytes(enc.encode(p)))).toEqual(before);
    expect(before).toEqual(PROMPTS.map(p => slash(p)));
  });

  it('memory grows to hold the whole input above the tables', () => {
    slash('x'.repeat(2_000_000));
    const bytes = (getInstance().exports.memory as WebAssembly.Memory).buffer.byteLength;
    expect(bytes).toBeGreaterThanOrEqual(WASM_INPUT_OFFSET + 2_000_000);
  });
});
