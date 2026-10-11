import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';
import { scan, type CallSite, type ScanOptions } from './scanner.js';
import { estimateMonthly, CALLS_PER_SITE_PER_DAY } from './report.js';

export interface ScanSide {
  /** The git ref scanned, or "working tree". */
  ref: string;
  sites: number;
  monthlyCost: number;
}

export interface FileDelta {
  file: string;
  sdk: string;
  sitesBefore: number;
  sitesAfter: number;
  monthlyBefore: number;
  monthlyAfter: number;
  monthlyDelta: number;
}

export interface ScanDiff {
  base: ScanSide;
  head: ScanSide;
  /** head.monthlyCost − base.monthlyCost, USD a month, at the scan's assumed traffic. */
  monthlyDelta: number;
  /** Files whose LLM call sites or cost changed, largest change first. */
  files: FileDelta[];
  callsPerSitePerDay: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Unpack one git ref of the repo at `dir` into a temp folder (git archive). */
function exportRef(dir: string, ref: string): string {
  const out = mkdtempSync(join(tmpdir(), 'slash-diff-'));
  const archive = spawnSync('git', ['-C', dir, 'archive', '--format=tar', ref], { maxBuffer: 512 * 1024 * 1024 });
  if (archive.status !== 0) {
    rmSync(out, { recursive: true, force: true });
    throw new Error(`git archive ${ref} failed: ${archive.stderr?.toString().trim() || 'unknown error'}`);
  }
  const untar = spawnSync('tar', ['-x', '-C', out], { input: archive.stdout });
  if (untar.status !== 0) {
    rmSync(out, { recursive: true, force: true });
    throw new Error(`could not unpack ${ref}: ${untar.stderr?.toString().trim()}`);
  }
  return out;
}

function scanSide(root: string, opts: ScanOptions): { sites: (CallSite & { rel: string })[]; monthly: number } {
  const { sites } = scan(root, opts);
  return {
    sites: sites.map(s => ({ ...s, rel: relative(root, s.file) })),
    monthly: estimateMonthly(sites).monthlyCost,
  };
}

/**
 * What a change does to the scan's monthly LLM cost: scan `base` and `head`
 * (default: the working tree) of the git repo at `dir`, and compare. Same
 * assumptions as the scan (100 calls a site a day, output twice the input,
 * each site priced at its SDK's representative model; test code and
 * .slashignore paths skipped unless opts.includeTests).
 */
export function scanDiff(dir: string, base: string, head?: string, opts: ScanOptions = {}): ScanDiff {
  const baseDir = exportRef(dir, base);
  const headDir = head ? exportRef(dir, head) : dir;
  try {
    const b = scanSide(baseDir, opts);
    const h = scanSide(headDir, opts);

    const groups = new Map<string, { file: string; sdk: string; before: CallSite[]; after: CallSite[] }>();
    const add = (s: CallSite & { rel: string }, side: 'before' | 'after') => {
      const key = `${s.rel}\u0000${s.sdk}`;
      const g = groups.get(key) ?? { file: s.rel, sdk: s.sdk, before: [], after: [] };
      g[side].push(s);
      groups.set(key, g);
    };
    b.sites.forEach(s => add(s, 'before'));
    h.sites.forEach(s => add(s, 'after'));

    const files: FileDelta[] = [];
    for (const g of groups.values()) {
      const monthlyBefore = estimateMonthly(g.before).monthlyCost;
      const monthlyAfter = estimateMonthly(g.after).monthlyCost;
      if (g.before.length === g.after.length && round2(monthlyBefore) === round2(monthlyAfter)) continue;
      files.push({
        file: g.file, sdk: g.sdk,
        sitesBefore: g.before.length, sitesAfter: g.after.length,
        monthlyBefore: round2(monthlyBefore), monthlyAfter: round2(monthlyAfter),
        monthlyDelta: round2(monthlyAfter - monthlyBefore),
      });
    }
    files.sort((x, y) => Math.abs(y.monthlyDelta) - Math.abs(x.monthlyDelta) || x.file.localeCompare(y.file));

    return {
      base: { ref: base, sites: b.sites.length, monthlyCost: round2(b.monthly) },
      head: { ref: head ?? 'working tree', sites: h.sites.length, monthlyCost: round2(h.monthly) },
      monthlyDelta: round2(h.monthly - b.monthly),
      files,
      callsPerSitePerDay: CALLS_PER_SITE_PER_DAY,
    };
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
    if (head) rmSync(headDir, { recursive: true, force: true });
  }
}
