#!/usr/bin/env bun
/**
 * Slash Tokenizer Calibration Benchmark
 * ======================================
 * Measures actual token counts via Anthropic count_tokens API
 * for both Opus 4.6 and 4.7, compares against Slash WASM estimates.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts
 *
 * Output:
 *   bench/results.json  — structured data
 *   bench/REPORT.md     — human-readable report
 */

import { slash } from '../src/index';
import { corpus } from './corpus';
import { writeFileSync } from 'fs';

// Auth: direct key OR proxy route (no key needed if ANTHROPIC_BASE_URL is set)
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const USE_PROXY = BASE_URL.includes('mcpaas.live');

if (!API_KEY && !USE_PROXY) {
  console.error('Set ANTHROPIC_API_KEY or ANTHROPIC_BASE_URL to run calibration');
  process.exit(1);
}
console.log(`Auth: ${USE_PROXY ? 'proxy (' + BASE_URL + ')' : 'direct API key'}`);

const MODELS = [
  { id: 'claude-opus-4-20250514', name: 'opus-4.6' },
  { id: 'claude-opus-4-7', name: 'opus-4.7' },
];

interface CountResult {
  model: string;
  modelName: string;
  corpus: string;
  type: string;
  actual: number;
  estimated: number;
  ratio: number; // estimated / actual
  delta: number; // (estimated - actual) / actual as percentage
}

async function countTokens(model: string, content: string): Promise<number | null> {
  try {
    // Route: proxy uses /slash/v1/... path, direct uses /v1/...
    const url = USE_PROXY
      ? `${BASE_URL}/v1/messages/count_tokens`
      : `${BASE_URL}/v1/messages/count_tokens`;

    const headers: Record<string, string> = {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };

    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }

    // Pass custom headers from env (Claude Code auth)
    const customHeaders = process.env.ANTHROPIC_CUSTOM_HEADERS;
    if (customHeaders) {
      // Format: "Key: Value" or "Key1: Value1, Key2: Value2"
      customHeaders.split(',').forEach(h => {
        const [k, ...v] = h.split(':');
        if (k && v.length) headers[k.trim()] = v.join(':').trim();
      });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) {
      const err = await res.json() as any;
      console.error(`  count_tokens failed for ${model}: ${err?.error?.message || res.status}`);
      return null;
    }
    const data = await res.json() as any;
    return data.input_tokens;
  } catch (e) {
    console.error(`  count_tokens error for ${model}: ${e}`);
    return null;
  }
}

async function run() {
  console.log('Slash Tokenizer Calibration Benchmark');
  console.log('=====================================\n');

  // Warm up WASM
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

  // Compute summary stats per model
  const summary: Record<string, { ratios: number[]; deltas: number[] }> = {};
  for (const r of results) {
    if (!summary[r.modelName]) summary[r.modelName] = { ratios: [], deltas: [] };
    summary[r.modelName].ratios.push(r.ratio);
    summary[r.modelName].deltas.push(r.delta);
  }

  // Compute 4.6 vs 4.7 delta
  const crossModel: { corpus: string; type: string; tokens46: number; tokens47: number; ratio: number }[] = [];
  for (const entry of corpus) {
    const r46 = results.find(r => r.corpus === entry.name && r.modelName === 'opus-4.6');
    const r47 = results.find(r => r.corpus === entry.name && r.modelName === 'opus-4.7');
    if (r46 && r47) {
      crossModel.push({
        corpus: entry.name,
        type: entry.type,
        tokens46: r46.actual,
        tokens47: r47.actual,
        ratio: r47.actual > 0 ? Math.round((r47.actual / r46.actual) * 1000) / 1000 : 0,
      });
    }
  }

  // Write JSON
  const output = { timestamp: new Date().toISOString(), results, summary: {}, crossModel };
  for (const [name, data] of Object.entries(summary)) {
    const sorted = [...data.ratios].sort((a, b) => a - b);
    (output.summary as any)[name] = {
      min_ratio: sorted[0],
      median_ratio: sorted[Math.floor(sorted.length / 2)],
      max_ratio: sorted[sorted.length - 1],
      min_delta: Math.min(...data.deltas),
      median_delta: data.deltas.sort((a, b) => a - b)[Math.floor(data.deltas.length / 2)],
      max_delta: Math.max(...data.deltas),
    };
  }

  writeFileSync('bench/results.json', JSON.stringify(output, null, 2));
  console.log('Written: bench/results.json');

  // Write markdown report
  let md = `# Slash Tokenizer Calibration Report\n\n`;
  md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Corpus:** ${corpus.length} samples (${[...new Set(corpus.map(c => c.type))].join(', ')})\n\n`;

  md += `## Summary\n\n`;
  md += `| Model | Min Ratio | Median | Max | Min Delta | Median | Max |\n`;
  md += `|-------|-----------|--------|-----|-----------|--------|-----|\n`;
  for (const [name, data] of Object.entries((output.summary as any))) {
    const d = data as any;
    md += `| ${name} | ${d.min_ratio} | ${d.median_ratio} | ${d.max_ratio} | ${d.min_delta}% | ${d.median_delta}% | ${d.max_delta}% |\n`;
  }

  if (crossModel.length > 0) {
    md += `\n## 4.6 → 4.7 Tokenizer Delta\n\n`;
    md += `| Corpus | Type | 4.6 tokens | 4.7 tokens | Ratio (4.7/4.6) |\n`;
    md += `|--------|------|-----------|-----------|----------------|\n`;
    for (const cm of crossModel) {
      md += `| ${cm.corpus} | ${cm.type} | ${cm.tokens46} | ${cm.tokens47} | ${cm.ratio}x |\n`;
    }
  }

  md += `\n## Raw Results\n\n`;
  md += `| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |\n`;
  md += `|--------|------|-------|--------|-----------|-------|-------|\n`;
  for (const r of results) {
    md += `| ${r.corpus} | ${r.type} | ${r.modelName} | ${r.actual} | ${r.estimated} | ${r.ratio} | ${r.delta}% |\n`;
  }

  md += `\n## Reproduction\n\n`;
  md += `\`\`\`bash\nANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts\n\`\`\`\n`;

  writeFileSync('bench/REPORT.md', md);
  console.log('Written: bench/REPORT.md');
}

run().catch(console.error);
