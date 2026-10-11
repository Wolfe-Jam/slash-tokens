#!/usr/bin/env bun
/**
 * OSS savings study
 * =================
 * For every LLM request in the pinned repos (repos.ts), what would decide()
 * save? Each request is quoted at the model the code names, at its max output
 * (4,096 when the code sets none), with the surrounding code as the input, then
 * decided twice: at the default floor (same tier only) and at floor 1 (any
 * same-provider model the prompt fits).
 *
 * Offline: no API keys, no live calls. Repos are fetched at the pinned commit
 * into bench/oss/.cache (gitignored).
 *
 * Usage:
 *   bun bench/oss/study.ts            # summary per repo
 *   ROWS=1 bun bench/oss/study.ts     # plus every request and every skip
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { quote, decide } from '../../src/index';
import { CATALOG } from '../../src/catalog';
import { canonicalModel } from '../../src/models';
import { REPOS, type Repo } from './repos';

const CACHE = join(import.meta.dir, '.cache');

// The extractor finds call sites with ripgrep. Without it every repo would
// read as 0 requests and results.json would be overwritten with zeros.
try {
  execSync('rg --version', { stdio: 'ignore' });
} catch {
  console.error('bench:oss needs ripgrep (rg) on PATH: brew install ripgrep / apt install ripgrep');
  process.exit(1);
}
const ROWS = !!process.env.ROWS;

type Row = { site: string; model: string; max: number; req: number; d0: number; d1: number; m0: string; m1: string };

function fetchRepo(r: Repo): string {
  const dir = join(CACHE, r.name.replace('/', '__'));
  if (existsSync(join(dir, '.git'))) {
    const head = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    if (head === r.commit) return dir;
  }
  mkdirSync(dir, { recursive: true });
  const run = (c: string) => execSync(c, { cwd: dir, stdio: 'ignore' });
  run('git init -q');
  run(`git fetch -q --depth 1 ${r.url} ${r.commit}`);
  run('git checkout -q FETCH_HEAD');
  return dir;
}

function price(site: string, model: string, max: number, input: string): Row {
  const t = { input, model, maxOutputTokens: max };
  const q = quote(t), a = decide(t), b = decide(t, { floor: 1 });
  return {
    site, model, max, req: q.cost.high, d0: a.chosen!.cost.high, d1: b.chosen!.cost.high,
    m0: a.action === 'downgrade' ? a.chosen!.model : '—',
    m1: b.action === 'downgrade' ? b.chosen!.model : '—',
  };
}

function context(src: string, line: number): string {
  return src.split('\n').slice(Math.max(0, line - 6), line + 20).join('\n');
}

/** The text of a call from its opening paren to the matching close. */
function callText(src: string, at: number): string {
  const open = src.indexOf('(', at);
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '(') depth++;
    else if (src[j] === ')' && --depth === 0) return src.slice(open, j + 1);
  }
  return src.slice(open, open + 800);
}

function units(dir: string, f: string): { name: string; src: string }[] {
  const raw = readFileSync(join(dir, f), 'utf8');
  if (!f.endsWith('.ipynb')) return [{ name: f, src: raw }];
  return JSON.parse(raw).cells.map((c: any, k: number) => ({
    name: `${f}#cell${k}`,
    src: c.cell_type === 'code' ? [].concat(c.source).join('') : '',
  }));
}

function scan(dir: string, cfg: { glob: string; call: string; defaultModel?: string }, skipped: string[]): Row[] {
  const rows: Row[] = [];
  let files: string[] = [];
  try {
    files = execSync(`rg -l --glob '${cfg.glob}' -e '${cfg.call}' .`, { cwd: dir, encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).map(f => f.replace(/^\.\//, '')).sort();
  } catch (err) {
    // rg exits 1 when nothing matches; anything else is a real failure.
    if ((err as { status?: number }).status !== 1) throw err;
  }
  const call = new RegExp(cfg.call, 'g');
  for (const f of files) {
    const us = units(dir, f);
    const fileModel = us.map(u => u.src).join('\n').match(/MODEL(?:_ID)?\s*=\s*["']([\w.\-]+)["']/)?.[1];
    for (const u of us) {
      for (const m of u.src.matchAll(call)) {
        const line = u.src.slice(0, m.index!).split('\n').length;
        const site = `${u.name}:${line}`;
        const args = callText(u.src, m.index!);
        const raw = args.match(/model\s*[:=]\s*["'`]([\w.\-]+)["'`]/)?.[1] ?? fileModel ?? cfg.defaultModel;
        if (!raw) { skipped.push(`${site} (model is a variable)`); continue; }
        let model = '';
        try { model = canonicalModel(raw); } catch {}
        if (!CATALOG[model]) { skipped.push(`${site} (${raw} not in the catalog)`); continue; }
        const mx = args.match(/max_?(?:output_?|completion_?)?[tT]okens["']?\s*[:=]\s*([\d_]+)/);
        rows.push(price(site, model, mx ? Number(mx[1].replace(/_/g, '')) : 4096, context(u.src, line)));
      }
    }
  }
  return rows;
}

const pct = (x: number, of: number) => (of ? Math.round((1 - x / of) * 100) : 0);
const results: any[] = [];

for (const r of REPOS) {
  const dir = fetchRepo(r);
  const skipped: string[] = [];
  const rows = 'sites' in r
    ? r.sites.map(s => price(`${s.file}:${s.line}`, canonicalModel(s.model), s.maxTokens, context(readFileSync(join(dir, s.file), 'utf8'), s.line)))
    : scan(dir, r.scan, skipped);

  const sum = (k: 'req' | 'd0' | 'd1') => rows.reduce((s, x) => s + x[k], 0);
  const R = sum('req'), A = sum('d0'), B = sum('d1');
  const byModel: Record<string, { n: number; req: number; d0: number; d1: number; m0: string; m1: string }> = {};
  for (const x of rows) {
    const b = byModel[x.model] ??= { n: 0, req: 0, d0: 0, d1: 0, m0: x.m0, m1: x.m1 };
    b.n++; b.req += x.req; b.d0 += x.d0; b.d1 += x.d1;
  }

  console.log(`\n## ${r.name} (${r.provider}) @ ${r.commit.slice(0, 7)}`);
  console.log(`${rows.length} requests | requested $${R.toFixed(4)} | default floor $${A.toFixed(4)} (${pct(A, R)}%) | floor 1 $${B.toFixed(4)} (${pct(B, R)}%) | skipped ${skipped.length}`);
  for (const [m, b] of Object.entries(byModel)) {
    console.log(`  ${m} ×${b.n}: default floor ${b.m0} ${pct(b.d0, b.req)}%, floor 1 ${b.m1} ${pct(b.d1, b.req)}%`);
  }
  if (ROWS) {
    console.log('\n| Site | Model | Max out | Default floor | Saved | Floor 1 | Saved |\n|---|---|---|---|---|---|---|');
    for (const x of rows) console.log(`| \`${x.site}\` | ${x.model} (t${CATALOG[x.model].tier}) | ${x.max} | ${x.m0} | ${pct(x.d0, x.req)}% | ${x.m1} | ${pct(x.d1, x.req)}% |`);
    if (skipped.length) console.log('\nSkipped:\n  ' + skipped.join('\n  '));
  }
  results.push({
    repo: r.name, provider: r.provider, commit: r.commit, requests: rows.length, skipped: skipped.length,
    requestedUsd: +R.toFixed(6), defaultFloorUsd: +A.toFixed(6), floor1Usd: +B.toFixed(6),
    defaultFloorSavedPct: pct(A, R), floor1SavedPct: pct(B, R), byModel,
  });
}

const tot = (k: string) => results.reduce((s, x) => s + x[k], 0);
const avg = (k: string) => Math.round(tot(k) / results.length);
console.log(`\n## All repos\npooled by dollars: default floor ${pct(tot('defaultFloorUsd'), tot('requestedUsd'))}%, floor 1 ${pct(tot('floor1Usd'), tot('requestedUsd'))}%`);
console.log(`average of repos:  default floor ${avg('defaultFloorSavedPct')}%, floor 1 ${avg('floor1SavedPct')}%`);

const { version } = JSON.parse(readFileSync(join(import.meta.dir, '../../package.json'), 'utf8'));
writeFileSync(join(import.meta.dir, 'results.json'), JSON.stringify({ slashTokens: version, repos: results }, null, 2) + '\n');
