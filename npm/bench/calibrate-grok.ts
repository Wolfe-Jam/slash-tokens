#!/usr/bin/env bun
/**
 * xAI (Grok) Tokenizer Calibration Benchmark
 * ============================================
 * xAI has no free tokenize/count-tokens endpoint (confirmed 2026-08-23) —
 * prompt_tokens only comes back from a real chat completion. max_tokens is
 * capped at 1 to minimize spend; this still costs real (small) money.
 *
 * IMPORTANT: xAI bundles a fixed system-preamble into prompt_tokens (~190
 * tokens observed on a 2-char message, mostly cached). That overhead has
 * nothing to do with the content we're calibrating against, so we measure
 * a baseline call first and subtract it from every sample.
 *
 * Usage:
 *   XAI_API_KEY=xai-xxx bun bench/calibrate-grok.ts
 */

import { slash } from '../src/index';
import { corpus } from './corpus';
import { writeFileSync } from 'fs';

const API_KEY = process.env.XAI_API_KEY || '';
if (!API_KEY) {
  console.error('Set XAI_API_KEY to run calibration');
  process.exit(1);
}

const MODELS = [
  { id: 'grok-4.20-0309-non-reasoning', name: 'grok-4.20' },
  { id: 'grok-4.3', name: 'grok-4-1-fast' },
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

async function promptTokens(model: string, content: string): Promise<number | null> {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        max_tokens: 1,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`  request failed for ${model}: ${(err as any)?.error || res.status}`);
      return null;
    }
    const data = await res.json() as any;
    return data.usage?.prompt_tokens ?? null;
  } catch (e) {
    console.error(`  request error for ${model}: ${e}`);
    return null;
  }
}

async function run() {
  console.log('xAI (Grok) Tokenizer Calibration Benchmark');
  console.log('===========================================\n');

  slash('warmup');

  // Establish the fixed system-preamble overhead per model with a 1-char baseline
  const baselines: Record<string, number> = {};
  console.log('Measuring baseline overhead (1-char message)...');
  for (const model of MODELS) {
    const base = await promptTokens(model.id, 'a');
    baselines[model.name] = base ?? 0;
    console.log(`  ${model.name}: baseline=${base}`);
  }
  console.log('');

  const results: CountResult[] = [];

  for (const entry of corpus) {
    console.log(`[${entry.type}] ${entry.name} (${entry.content.length} chars)`);
    const estimated = slash(entry.content);

    for (const model of MODELS) {
      const raw = await promptTokens(model.id, entry.content);
      if (raw === null) {
        console.log(`  ${model.name}: SKIPPED (request failed)`);
        continue;
      }
      // Subtract this model's fixed preamble overhead — content-only count
      const actual = Math.max(0, raw - baselines[model.name]);
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
      console.log(`  ${model.name}: raw=${raw} baseline=${baselines[model.name]} actual=${actual} estimated=${estimated} ratio=${ratio.toFixed(3)} delta=${sign}${delta.toFixed(1)}%`);
    }
    console.log('');
  }

  const summary: Record<string, { ratios: number[]; deltas: number[] }> = {};
  for (const r of results) {
    if (!summary[r.modelName]) summary[r.modelName] = { ratios: [], deltas: [] };
    summary[r.modelName].ratios.push(r.ratio);
    summary[r.modelName].deltas.push(r.delta);
  }

  const output = { timestamp: new Date().toISOString(), baselines, results, summary: {} as any };
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

  writeFileSync('bench/results-grok.json', JSON.stringify(output, null, 2));
  console.log('Written: bench/results-grok.json');

  let md = `# xAI (Grok) Tokenizer Calibration Report\n\n`;
  md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Corpus:** ${corpus.length} samples (${[...new Set(corpus.map(c => c.type))].join(', ')})\n`;
  md += `**Baselines (fixed system-preamble overhead, subtracted from all samples):** ${JSON.stringify(baselines)}\n\n`;
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
  md += `\`\`\`bash\nXAI_API_KEY=xai-xxx bun bench/calibrate-grok.ts\n\`\`\`\n`;

  writeFileSync('bench/REPORT-grok.md', md);
  console.log('Written: bench/REPORT-grok.md');
}

run().catch(console.error);
