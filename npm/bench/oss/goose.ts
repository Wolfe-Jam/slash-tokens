#!/usr/bin/env bun
/**
 * Goose job model
 * ===============
 * aaif-goose/goose @ 3bd8520 runs every call on one configured model,
 * including one-shot jobs (session titles, tool labels, compaction) that go
 * through complete_one_shot with no max_tokens set, so 4,096 is the cap.
 * These are modelled sizes, not measured from goose: filler text sized to
 * each job, quoted at goose's provider defaults.
 *
 * Usage:
 *   bun bench/oss/goose.ts
 */

import { quote, decide } from '../../src/index';

// crates/goose-providers/src/{anthropic,openai}.rs, crates/goose/src/providers/xai.rs.
// Google's default (gemini-2.5-pro) is not in the catalog.
const DEFAULTS = ['claude-sonnet-4-5', 'gpt-6.1-sol', 'grok-4.5'];

const JOBS: [job: string, approxTokens: number][] = [
  ['session title', 1_500],
  ['tool label', 400],
  ['main turn, 30k context', 30_000],
  ['compaction at ~180k', 180_000],
];

const sentence = 'the agent read the file and ran the test then fixed the bug ';
const filler = (tokens: number) => sentence.repeat(Math.ceil(tokens / 13));

console.log('| Default model | Job | Requested (high) | Default floor | Floor 1 |\n|---|---|---|---|---|');
for (const model of DEFAULTS) {
  for (const [job, tokens] of JOBS) {
    const t = { input: filler(tokens), model, maxOutputTokens: 4096 };
    const q = quote(t);
    const cell = (d: ReturnType<typeof decide>) =>
      `${d.action === 'downgrade' ? d.chosen!.model : '—'} ${Math.round((1 - d.chosen!.cost.high / q.cost.high) * 100)}%`;
    console.log(`| ${model} | ${job} | $${q.cost.high.toFixed(4)} | ${cell(decide(t))} | ${cell(decide(t, { floor: 1 }))} |`);
  }
}
