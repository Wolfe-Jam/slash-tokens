#!/usr/bin/env bun
/**
 * OpenAI (GPT) Tokenizer Calibration Benchmark
 * =============================================
 * Ground truth via js-tiktoken (o200k_base — the encoding for all current
 * GPT models per OpenAI's own tiktoken docs). Fully local, free, exact —
 * no API key, no network call, no cost. This is why the OpenAI gap has
 * no excuse to stay open: Anthropic ground truth needs a paid API call,
 * OpenAI ground truth is a local library call.
 *
 * Usage: bun bench/calibrate-openai.ts
 */

import { getEncoding } from 'js-tiktoken';
import { slash } from '../src/index';
import { corpus } from './corpus';

const enc = getEncoding('o200k_base');

interface Result {
  corpus: string;
  type: string;
  actual: number;
  estimated: number;
  ratio: number;
  delta: number;
}

const results: Result[] = [];

for (const entry of corpus) {
  const actual = enc.encode(entry.content).length;
  const estimated = slash(entry.content);
  const ratio = actual > 0 ? estimated / actual : 0;
  const delta = actual > 0 ? ((estimated - actual) / actual) * 100 : 0;
  results.push({
    corpus: entry.name,
    type: entry.type,
    actual,
    estimated,
    ratio: Math.round(ratio * 1000) / 1000,
    delta: Math.round(delta * 10) / 10,
  });
}

console.log('OpenAI (o200k_base) Calibration Check — RAW WASM estimate, no calibration factor applied\n');
console.log('corpus'.padEnd(20), 'type'.padEnd(10), 'actual'.padStart(8), 'raw_est'.padStart(8), 'ratio'.padStart(8), 'delta'.padStart(8));
for (const r of results) {
  console.log(
    r.corpus.padEnd(20),
    r.type.padEnd(10),
    String(r.actual).padStart(8),
    String(r.estimated).padStart(8),
    r.ratio.toFixed(3).padStart(8),
    (r.delta >= 0 ? '+' : '') + r.delta.toFixed(1) + '%'.padStart(1)
  );
}

const deltas = results.map(r => r.delta).sort((a, b) => a - b);
console.log('\nMedian delta:', deltas[Math.floor(deltas.length / 2)].toFixed(1) + '%');
console.log('Min delta:', Math.min(...deltas).toFixed(1) + '%');
console.log('Max delta:', Math.max(...deltas).toFixed(1) + '%');
console.log('Under-reporting:', deltas.filter(d => d < 0).length + '/' + deltas.length, 'samples');
