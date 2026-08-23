#!/usr/bin/env bun
/**
 * Gemini Tokenizer Calibration Benchmark
 * =======================================
 * Ground truth via Google's models.countTokens endpoint — free, no
 * completion generated, just a token count. Needs a Gemini API key
 * (AI Studio free tier is enough).
 *
 * Usage:
 *   GEMINI_API_KEY=AIzaxxx bun bench/calibrate-gemini.ts
 */

import { slash } from '../src/index';
import { corpus } from './corpus';
import { writeFileSync } from 'fs';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
if (!API_KEY) {
  console.error('Set GEMINI_API_KEY (or GOOGLE_API_KEY) to run calibration');
  process.exit(1);
}

const MODELS = [
  { id: 'gemini-pro-latest', name: 'gemini-3.1-pro' },
  { id: 'gemini-flash-latest', name: 'gemini-2.5-flash' },
];

interface CountResult {
  model: string;
  modelName: string;
  corpus: string;
  type: string;
  actual: number;
  estimated: number;
  ratio: number;
  delta: number;
}

async function countTokens(model: string, content: string): Promise<number | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens?key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: content }] }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`  countTokens failed for ${model}: ${(err as any)?.error?.message || res.status}`);
      return null;
    }
    const data = await res.json() as any;
    return data.totalTokens;
  } catch (e) {
    console.error(`  countTokens error for ${model}: ${e}`);
    return null;
  }
}

async function run() {
  console.log('Gemini Tokenizer Calibration Benchmark');
  console.log('=======================================\n');

  slash('warmup');

  const results: CountResult[] = [];

  for (const entry of corpus) {
    console.log(`[${entry.type}] ${entry.name} (${entry.content.length} chars)`);
    const estimated = slash(entry.content);

    for (const model of MODELS) {
      const actual = await countTokens(model.id, entry.content);
      if (actual === null) {
        console.log(`  ${model.name}: SKIPPED (model unavailable)`);
        continue;
      }
      const ratio = actual > 0 ? estimated / actual : 0;
      const delta = actual > 0 ? ((estimated - actual) / actual) * 100 : 0;

      results.push({
        model: model.id,
        modelName: model.name,
        corpus: entry.name,
        type: entry.type,
        actual,
        estimated,
        ratio: Math.round(ratio * 1000) / 1000,
        delta: Math.round(delta * 10) / 10,
      });

      const sign = delta >= 0 ? '+' : '';
      console.log(`  ${model.name}: actual=${actual} estimated=${estimated} ratio=${ratio.toFixed(3)} delta=${sign}${delta.toFixed(1)}%`);
    }
    console.log('');
  }

  const summary: Record<string, { ratios: number[]; deltas: number[] }> = {};
  for (const r of results) {
    if (!summary[r.modelName]) summary[r.modelName] = { ratios: [], deltas: [] };
    summary[r.modelName].ratios.push(r.ratio);
    summary[r.modelName].deltas.push(r.delta);
  }

  const output = { timestamp: new Date().toISOString(), results, summary: {} as any };
  for (const [name, data] of Object.entries(summary)) {
    const sorted = [...data.ratios].sort((a, b) => a - b);
    output.summary[name] = {
      min_ratio: sorted[0],
      median_ratio: sorted[Math.floor(sorted.length / 2)],
      max_ratio: sorted[sorted.length - 1],
      min_delta: Math.min(...data.deltas),
      median_delta: data.deltas.sort((a, b) => a - b)[Math.floor(data.deltas.length / 2)],
      max_delta: Math.max(...data.deltas),
    };
  }

  writeFileSync('bench/results-gemini.json', JSON.stringify(output, null, 2));
  console.log('Written: bench/results-gemini.json');

  let md = `# Gemini Tokenizer Calibration Report\n\n`;
  md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Corpus:** ${corpus.length} samples (${[...new Set(corpus.map(c => c.type))].join(', ')})\n\n`;
  md += `## Summary\n\n`;
  md += `| Model | Min Ratio | Median | Max | Min Delta | Median | Max |\n`;
  md += `|-------|-----------|--------|-----|-----------|--------|-----|\n`;
  for (const [name, data] of Object.entries(output.summary)) {
    const d = data as any;
    md += `| ${name} | ${d.min_ratio} | ${d.median_ratio} | ${d.max_ratio} | ${d.min_delta}% | ${d.median_delta}% | ${d.max_delta}% |\n`;
  }
  md += `\n## Raw Results\n\n`;
  md += `| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |\n`;
  md += `|--------|------|-------|--------|-----------|-------|-------|\n`;
  for (const r of results) {
    md += `| ${r.corpus} | ${r.type} | ${r.modelName} | ${r.actual} | ${r.estimated} | ${r.ratio} | ${r.delta}% |\n`;
  }
  md += `\n## Reproduction\n\n`;
  md += `\`\`\`bash\nGEMINI_API_KEY=AIzaxxx bun bench/calibrate-gemini.ts\n\`\`\`\n`;

  writeFileSync('bench/REPORT-gemini.md', md);
  console.log('Written: bench/REPORT-gemini.md');
}

run().catch(console.error);
