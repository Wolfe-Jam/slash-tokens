/**
 * WJTTC — Accuracy gate: Slash never under-reports on the bench corpus.
 *
 * Ground truth is the providers' own counts, recorded by the bench scripts
 * (bench/results*.json: Anthropic count_tokens, Google countTokens, xAI usage,
 * the real Nemotron tokenizer) plus OpenAI's o200k_base, computed here with
 * js-tiktoken. Every calibrated estimate must be at least the real count.
 * A change to the WASM engine, a calibration factor or the corpus that breaks
 * "never under-report" fails CI here.
 *
 * Run: bun test tests/accuracy-gate.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getEncoding } from 'js-tiktoken';
import { slash, CATALOG } from '../src/index';
import { corpus } from '../bench/corpus';

const bench = join(dirname(fileURLToPath(import.meta.url)), '../bench');
const load = (f: string) => JSON.parse(readFileSync(join(bench, f), 'utf8')).results as
  { corpus: string; actual: number; modelName?: string }[];
const content = new Map(corpus.map(c => [c.name, c.content]));

// Bench model name → catalog keys that carry the same calibration factor.
const FAMILIES: [file: string, benchModel: string | undefined, models: string[]][] = [
  ['results.json', 'opus-4.7', ['claude-opus-4.7', 'claude-opus-5', 'claude-opus-5.5', 'claude-fable-5.1']],
  ['results.json', 'sonnet-5', ['claude-sonnet-5', 'claude-sonnet-5.5', 'claude-sonnet-4.6']],
  ['results.json', 'haiku-4.5', ['claude-haiku-4.5', 'claude-haiku']],
  ['results-gemini.json', 'gemini-3.1-pro', ['gemini-3.1-pro', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']],
  ['results-gemini.json', 'gemini-2.5-flash', ['gemini-2.5-flash', 'gemini-3.5-flash']],
  ['results-grok.json', 'grok-4.20', ['grok-4.20', 'grok-4.6', 'grok-4.7']],
  ['results-grok.json', 'grok-4-1-fast', ['grok-4-1-fast', 'grok-4.3']],
  ['results-nemotron.json', undefined, ['nemotron-3-ultra', 'nemotron-3-super', 'nemotron-3-nano', 'nemotron-3.5-lightning']],
];

describe('accuracy gate — calibrated estimate >= real count, every corpus sample', () => {
  it('the bench corpus and the recorded results agree (29 samples)', () => {
    expect(corpus).toHaveLength(29);
    for (const [file] of FAMILIES) {
      for (const r of load(file)) expect(content.has(r.corpus)).toBe(true);
    }
  });

  for (const [file, benchModel, models] of FAMILIES) {
    it(`${benchModel ?? 'nemotron'} (${file}) → ${models.join(', ')}`, () => {
      const rows = load(file).filter(r => benchModel === undefined || r.modelName === benchModel);
      expect(rows).toHaveLength(29);
      for (const model of models) {
        expect(CATALOG[model]).toBeDefined();
        for (const r of rows) {
          const est = slash(content.get(r.corpus)!, model);
          expect([model, r.corpus, est >= r.actual]).toEqual([model, r.corpus, true]);
        }
      }
    });
  }

  it('GPT-5.x (o200k_base, computed live) → gpt-5.4, mini, nano, 5.6 Sol / Terra / Luna', () => {
    const enc = getEncoding('o200k_base');
    for (const model of ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']) {
      for (const c of corpus) {
        const est = slash(c.content, model);
        expect([model, c.name, est >= enc.encode(c.content).length]).toEqual([model, c.name, true]);
      }
    }
  });
});
