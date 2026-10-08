#!/usr/bin/env bun
/**
 * NVIDIA Nemotron Tokenizer Calibration Benchmark
 * ================================================
 * Ground truth: the real Nemotron tokenizer from Hugging Face, run locally
 * (no API key, no network call to a model, no cost). Nemotron 3 Nano,
 * Super, Ultra and 3.5 Lightning share one BPE tokenizer (131,072 vocab):
 * their tokenizer.json files have identical vocab, merges and pre-tokenizer
 * (checked 2026-10-08), so one run covers the family.
 *
 * Pinned to an exact revision so the number can be reproduced.
 *
 * Usage: bun bench/calibrate-nemotron.ts   (needs `uv`)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { slash } from '../src/index';
import { corpus } from './corpus';

const REPO = 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16';
const REVISION = '2dc98e2afe4face0e4ce40972a915c45368bd34a';
const TOKENIZERS_VERSION = '0.22.1';

const dir = join(tmpdir(), 'slash-nemotron-bench');
mkdirSync(dir, { recursive: true });
const tokFile = join(dir, `tokenizer-${REVISION.slice(0, 12)}.json`);
if (!existsSync(tokFile)) {
  const res = await fetch(`https://huggingface.co/${REPO}/resolve/${REVISION}/tokenizer.json`);
  if (!res.ok) throw new Error(`tokenizer download failed: ${res.status}`);
  writeFileSync(tokFile, Buffer.from(await res.arrayBuffer()));
}

const textsFile = join(dir, 'corpus.json');
writeFileSync(textsFile, JSON.stringify(corpus.map(c => c.content)));
const proc = Bun.spawnSync(
  ['uv', 'run', '--quiet', '--no-project', '--with', `tokenizers==${TOKENIZERS_VERSION}`,
   'python', join(import.meta.dir, 'nemotron_count.py'), textsFile, tokFile],
  { stdout: 'pipe', stderr: 'pipe' },
);
if (proc.exitCode !== 0) throw new Error(`tokenizer run failed: ${proc.stderr.toString()}`);
const actuals: number[] = JSON.parse(proc.stdout.toString());

interface Result { corpus: string; type: string; actual: number; estimated: number; ratio: number; delta: number }
const results: Result[] = corpus.map((entry, i) => {
  const actual = actuals[i];
  const estimated = slash(entry.content);
  return {
    corpus: entry.name,
    type: entry.type,
    actual,
    estimated,
    ratio: Math.round((estimated / actual) * 1000) / 1000,
    delta: Math.round(((estimated - actual) / actual) * 1000) / 10,
  };
});

console.log(`Nemotron (${REPO}@${REVISION.slice(0, 7)}) — RAW WASM estimate, no calibration factor applied\n`);
console.log('corpus'.padEnd(20), 'type'.padEnd(10), 'actual'.padStart(8), 'raw_est'.padStart(8), 'ratio'.padStart(8), 'delta'.padStart(8));
for (const r of results) {
  console.log(r.corpus.padEnd(20), r.type.padEnd(10), String(r.actual).padStart(8), String(r.estimated).padStart(8),
    r.ratio.toFixed(3).padStart(8), `${r.delta}%`.padStart(8));
}
const ratios = results.map(r => r.ratio).sort((a, b) => a - b);
const min = ratios[0];
const worst = results.find(r => r.ratio === min)!;
console.log(`\nmin ratio ${min} (${worst.corpus}) · median ${ratios[Math.floor(ratios.length / 2)]} · max ${ratios[ratios.length - 1]}`);
console.log(`never under-report needs factor >= ${(1 / min).toFixed(3)}`);

writeFileSync(join(import.meta.dir, 'results-nemotron.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  tokenizer: { repo: REPO, revision: REVISION, tokenizers: TOKENIZERS_VERSION },
  results,
}, null, 2) + '\n');
