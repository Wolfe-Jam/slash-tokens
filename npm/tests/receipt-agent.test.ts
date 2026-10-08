/**
 * WJTTC — reconcile() · hire().run() · `slash-tokens quote`  (1.7.0)
 *
 * Run: bun test tests/receipt-agent.test.ts
 *
 *   TIER 1 (BRAKE)  - usage from both provider styles reads the same
 *   TIER 2 (ENGINE) - receipt math: actual cost, saved, fee, never-under flag
 *   TIER 3 (AERO)   - the agent: books, runs, reconciles, keeps the budget
 *   TIER 4 (PIT)    - the CLI quote command (src and dist)
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slash, quote, reconcile, normalizeUsage, hire, init, MODELS } from '../src/index';
import type { CallModel } from '../src/index';

beforeAll(() => {
  slash('warmup');
  init({ route: true, models: Object.keys(MODELS) });
});

const prompt = 'Add a unit test for the empty-slot case and fix the off-by-one in the scorer.';

describe('TIER 1: BRAKE — usage, both styles', () => {
  it('OpenAI-style: prompt_tokens already includes cached', () => {
    expect(normalizeUsage({
      prompt_tokens: 1200, completion_tokens: 300,
      prompt_tokens_details: { cached_tokens: 1000 }, completion_tokens_details: { reasoning_tokens: 120 },
    })).toEqual({ input: 1200, output: 300, cached: 1000, reasoning: 120 });
  });

  it('Anthropic-style: input_tokens excludes cache reads and writes, so they are added', () => {
    expect(normalizeUsage({
      input_tokens: 200, output_tokens: 300, cache_read_input_tokens: 1000, cache_creation_input_tokens: 50,
    })).toEqual({ input: 1250, output: 300, cached: 1000, reasoning: 0 });
  });

  it('empty usage is zeros', () => {
    expect(normalizeUsage({})).toEqual({ input: 0, output: 0, cached: 0, reasoning: 0 });
  });
});

describe('TIER 2: ENGINE — reconcile()', () => {
  it('prices the actual usage and compares it with the quote', () => {
    const q = quote({ input: prompt, model: 'nemotron-3.5-lightning', maxOutputTokens: 2000 });
    const r = reconcile(q, { prompt_tokens: 20, completion_tokens: 500 });
    expect(r.actual.cost).toBeCloseTo((20 * 0.06 + 500 * 0.24) / 1e6, 6);
    expect(r.underReported).toBe(q.inputTokens < 20);
    expect(r.withinQuote).toBe(true);
    expect(r.estimate.cost).toEqual(q.cost);
    expect(r.asOf).toBe(q.asOf);
  });

  it('no baseline → saved 0, fee 0', () => {
    const q = quote({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000 });
    const r = reconcile(q, { prompt_tokens: 30, completion_tokens: 400 });
    expect(r.baseline.model).toBe('nemotron-3-ultra');
    expect(r.saved).toBe(0);
    expect(r.fee.amount).toBe(0);
  });

  it('saved vs a baseline, and a 10% fee on it — shown, waived by default', () => {
    const q = quote({ input: prompt, model: 'nemotron-3.5-lightning', maxOutputTokens: 1000 });
    const r = reconcile(q, { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 }, { baseline: 'nemotron-3-ultra' });
    // Ultra $1 + $3 = $4.00; Lightning $0.06 + $0.24 = $0.30
    expect(r.baseline.cost).toBeCloseTo(4.00, 6);
    expect(r.actual.cost).toBeCloseTo(0.30, 6);
    expect(r.saved).toBeCloseTo(3.70, 6);
    expect(r.fee).toEqual({ rate: 0.10, amount: 0.37, waived: true, charged: 0 });
  });

  it('fee is charged only when not waived; never on a loss', () => {
    const q = quote({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000 });
    const charged = reconcile(q, { prompt_tokens: 1_000_000, completion_tokens: 0 }, { baseline: 'claude-opus-5', waived: false, feeRate: 0.2 });
    expect(charged.fee.charged).toBeCloseTo((5.00 - 1.00) * 0.2, 6);
    const loss = reconcile(q, { prompt_tokens: 1000, completion_tokens: 0 }, { baseline: 'nemotron-3.5-lightning', waived: false });
    expect(loss.saved).toBeLessThan(0);
    expect(loss.fee.charged).toBe(0);
  });

  it('flags an under-count — the thing Slash must never do', () => {
    const q = quote({ input: 'hi', model: 'gpt-5.4', maxOutputTokens: 10 });
    const r = reconcile(q, { prompt_tokens: q.inputTokens + 50, completion_tokens: 1 });
    expect(r.underReported).toBe(true);
    expect(r.inputError).toBeLessThan(0);
  });

  it('accepts a real API ID as baseline; rejects an unknown one', () => {
    const q = quote({ input: prompt, model: 'claude-haiku-4.5', maxOutputTokens: 10 });
    expect(reconcile(q, { input_tokens: 10, output_tokens: 1 }, { baseline: 'claude-opus-4-7' }).baseline.model).toBe('claude-opus-4.7');
    expect(() => reconcile(q, { input_tokens: 10 }, { baseline: 'gpt-99' })).toThrow('Unknown baseline');
  });
});

describe('TIER 3: AERO — hire().run()', () => {
  const fakeCall = (seen: string[]): CallModel => async (model) => {
    seen.push(model);
    return { output: `done by ${model}`, usage: { prompt_tokens: 40, completion_tokens: 600 } };
  };

  it('books the cheaper model, runs it, and returns a receipt against the asked-for model', async () => {
    const seen: string[] = [];
    const agent = hire({ floor: 1 });
    const res = await agent.run({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000, call: fakeCall(seen) });
    expect(res.decision.action).toBe('downgrade');
    expect(seen).toEqual(['nemotron-3.5-lightning']);
    expect(res.output).toBe('done by nemotron-3.5-lightning');
    expect(res.receipt!.baseline.model).toBe('nemotron-3-ultra');
    expect(res.receipt!.saved).toBeGreaterThan(0);
    expect(agent.spent).toBe(res.receipt!.actual.cost);
    expect(agent.receipts).toHaveLength(1);
  });

  it('a fixed baseline measures every job against it', async () => {
    const agent = hire({ floor: 1, baseline: 'claude-opus-5' });
    const res = await agent.run({ input: prompt, model: 'nemotron-3-super', maxOutputTokens: 1000, call: fakeCall([]) });
    expect(res.receipt!.baseline.model).toBe('claude-opus-5');
  });

  it('blocked jobs never call the model and spend nothing', async () => {
    const seen: string[] = [];
    const agent = hire({ budget: 0.0000001, floor: 3 });
    const res = await agent.run({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000, call: fakeCall(seen) });
    expect(res.decision.action).toBe('block');
    expect(seen).toEqual([]);
    expect(res.receipt).toBeUndefined();
    expect(agent.spent).toBe(0);
  });

  it('the budget covers all jobs: later jobs get only what is left', async () => {
    const one = quote({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000 });
    // Room for one Ultra job at its quote, not two: after the first, what is left is under one quote.
    const agent = hire({ budget: one.cost.high * 1.5, floor: 3 });
    const call: CallModel = async () => ({ output: 'ok', usage: { prompt_tokens: 40, completion_tokens: 900 } });
    const first = await agent.run({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000, call });
    expect(first.decision.action).toBe('go');
    expect(agent.remaining).toBeCloseTo(one.cost.high * 1.5 - first.receipt!.actual.cost, 6);
    const second = await agent.run({ input: prompt, model: 'nemotron-3-ultra', maxOutputTokens: 1000, call });
    expect(second.decision.action).toBe('block');
  });

  it('a failing call throws and records nothing', async () => {
    const agent = hire();
    const boom: CallModel = async () => { throw new Error('429'); };
    await expect(agent.run({ input: prompt, model: 'gpt-5.4', call: boom })).rejects.toThrow('429');
    expect(agent.receipts).toHaveLength(0);
    expect(agent.spent).toBe(0);
  });
});

describe('TIER 4: PIT — slash-tokens quote', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bins = [['bun', join(here, '../src/cli.ts')]];
  const dist = join(here, '../dist/cli.js');
  if (existsSync(dist)) bins.push(['node', dist]);

  async function cli(bin: string[], args: string[], stdin?: string) {
    const proc = Bun.spawn([...bin, ...args], { stdin: stdin === undefined ? 'ignore' : new Blob([stdin]), stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    return { stdout, stderr, code };
  }

  for (const bin of bins) {
    const name = bin[0] === 'bun' ? 'src' : 'dist';

    it(`[${name}] --json gives the quote and the decision`, async () => {
      const { stdout, code } = await cli(bin, ['quote', '--model', 'nemotron-3-ultra', '--text', prompt, '--max-output=1000', '--floor', '1', '--json']);
      expect(code).toBe(0);
      const out = JSON.parse(stdout);
      expect(out.quote.model).toBe('nemotron-3-ultra');
      expect(out.decision.action).toBe('downgrade');
      expect(out.decision.chosen.model).toBe('nemotron-3.5-lightning');
    });

    it(`[${name}] reads the prompt from stdin`, async () => {
      const { stdout, code } = await cli(bin, ['quote', '--model', 'claude-haiku-4.5', '--json'], prompt);
      expect(code).toBe(0);
      expect(JSON.parse(stdout).quote.inputTokens).toBe(slash(prompt, 'claude-haiku-4.5'));
    });

    it(`[${name}] human output names the action`, async () => {
      const { stdout } = await cli(bin, ['quote', '--model', 'nemotron-3-ultra', '--text', prompt, '--budget', '0.0000001', '--floor', '3']);
      expect(stdout).toContain('BLOCK');
      expect(stdout).toContain('assumed ceiling');
    });

    it(`[${name}] bad input exits 1 with a reason`, async () => {
      const noModel = await cli(bin, ['quote', '--text', 'x']);
      expect(noModel.code).toBe(1);
      expect(noModel.stderr).toContain('--model is required');
      const badFloor = await cli(bin, ['quote', '--model', 'gpt-5.4', '--text', 'x', '--floor', '7']);
      expect(badFloor.code).toBe(1);
      const unknown = await cli(bin, ['quote', '--model', 'gpt-99', '--text', 'x']);
      expect(unknown.stderr).toContain('Unknown model');
    });
  }
});
