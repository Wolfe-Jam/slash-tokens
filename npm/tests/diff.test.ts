/**
 * slash-tokens diff: the scan's monthly LLM cost at two git refs.
 * Builds a throwaway git repo per test.
 *
 * Run: bun test tests/diff.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { scanDiff } from '../src/diff';

const ANTHROPIC = `import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
export const ask = (q: string) => client.messages.create({ model: 'claude-opus-5', max_tokens: 512, messages: [{ role: 'user', content: q }] });
`;
const OPENAI = `import OpenAI from 'openai';
const client = new OpenAI();
export const sum = (t: string) => client.chat.completions.create({ model: 'gpt-5.4', messages: [{ role: 'user', content: t }] });
`;

function repo(): { dir: string; commit: (files: Record<string, string | null>, msg: string) => void } {
  const dir = mkdtempSync(join(tmpdir(), 'slash-diff-test-'));
  const git = (...a: string[]) => {
    const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 'test');
  return {
    dir,
    commit(files, msg) {
      for (const [p, c] of Object.entries(files)) {
        const full = join(dir, p);
        if (c === null) rmSync(full); else { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, c); }
      }
      git('add', '-A');
      git('commit', '-q', '-m', msg, '--allow-empty');
    },
  };
}

describe('scanDiff()', () => {
  it('a change that adds an LLM call costs more; the file shows it', () => {
    const r = repo();
    try {
      r.commit({ 'src/a.ts': ANTHROPIC, 'README.md': 'hi' }, 'base');
      r.commit({ 'src/b.ts': OPENAI }, 'add openai');
      const d = scanDiff(r.dir, 'HEAD~1', 'HEAD');
      expect(d.base.sites).toBe(1);
      expect(d.head.sites).toBe(2);
      expect(d.monthlyDelta).toBeGreaterThan(0);
      expect(d.monthlyDelta).toBeCloseTo(d.head.monthlyCost - d.base.monthlyCost, 1);
      expect(d.files).toHaveLength(1);
      expect(d.files[0]).toMatchObject({ file: 'src/b.ts', sdk: 'OpenAI', sitesBefore: 0, sitesAfter: 1 });
    } finally { rmSync(r.dir, { recursive: true, force: true }); }
  });

  it('removing a call saves money; an unrelated change shows no files', () => {
    const r = repo();
    try {
      r.commit({ 'src/a.ts': ANTHROPIC, 'src/b.ts': OPENAI }, 'base');
      r.commit({ 'src/b.ts': null }, 'drop openai');
      r.commit({ 'README.md': 'docs only' }, 'docs');
      const removed = scanDiff(r.dir, 'HEAD~2', 'HEAD~1');
      expect(removed.monthlyDelta).toBeLessThan(0);
      expect(removed.files[0]).toMatchObject({ file: 'src/b.ts', sitesBefore: 1, sitesAfter: 0 });
      const docs = scanDiff(r.dir, 'HEAD~1', 'HEAD');
      expect(docs.monthlyDelta).toBe(0);
      expect(docs.files).toEqual([]);
    } finally { rmSync(r.dir, { recursive: true, force: true }); }
  });

  it('head defaults to the working tree (uncommitted edits count)', () => {
    const r = repo();
    try {
      r.commit({ 'src/a.ts': ANTHROPIC }, 'base');
      writeFileSync(join(r.dir, 'src/c.ts'), OPENAI);
      const d = scanDiff(r.dir, 'HEAD');
      expect(d.head.ref).toBe('working tree');
      expect(d.files.map(f => f.file)).toEqual(['src/c.ts']);
    } finally { rmSync(r.dir, { recursive: true, force: true }); }
  });

  it("test code and .slashignore paths don't count; --include-tests brings tests back", () => {
    const r = repo();
    try {
      r.commit({ 'src/a.ts': ANTHROPIC }, 'base');
      r.commit({ 'tests/mock.ts': OPENAI, 'src/b.test.ts': OPENAI, 'src/fixture.ts': OPENAI, '.slashignore': 'src/fixture.ts\n' }, 'tests + ignored fixture');
      const d = scanDiff(r.dir, 'HEAD~1', 'HEAD');
      expect(d.monthlyDelta).toBe(0);
      expect(d.files).toEqual([]);
      const withTests = scanDiff(r.dir, 'HEAD~1', 'HEAD', { includeTests: true });
      expect(withTests.files.map(f => f.file).sort()).toEqual(['src/b.test.ts', 'tests/mock.ts']);
    } finally { rmSync(r.dir, { recursive: true, force: true }); }
  });

  it('a bad ref is a clear error', () => {
    const r = repo();
    try {
      r.commit({ 'src/a.ts': ANTHROPIC }, 'base');
      expect(() => scanDiff(r.dir, 'no-such-ref')).toThrow('git archive no-such-ref failed');
    } finally { rmSync(r.dir, { recursive: true, force: true }); }
  });
});

describe('slash-tokens diff (CLI)', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bins = [['bun', join(here, '../src/cli.ts')]];
  if (existsSync(join(here, '../dist/cli.js'))) bins.push(['node', join(here, '../dist/cli.js')]);

  for (const bin of bins) {
    const name = bin[0] === 'bun' ? 'src' : 'dist';
    it(`[${name}] --json for pipelines; text for people; usage on bad input`, () => {
      const r = repo();
      try {
        r.commit({ 'src/a.ts': ANTHROPIC }, 'base');
        r.commit({ 'src/b.ts': OPENAI }, 'add openai');
        const run = (...a: string[]) => spawnSync(bin[0], [bin[1], 'diff', ...a], { cwd: r.dir, encoding: 'utf8' });
        const json = run('HEAD~1', 'HEAD', '--json');
        expect(json.status).toBe(0);
        expect(JSON.parse(json.stdout).files[0].file).toBe('src/b.ts');
        const text = run('HEAD~1', 'HEAD');
        expect(text.stdout).toContain('change: +$');
        expect(text.stdout).toContain(': 1 call site, $');
        expect(text.stdout).toContain('src/b.ts (OpenAI): 0 → 1 site,');
        const bad = run();
        expect(bad.status).toBe(1);
        expect(bad.stderr).toContain('usage: slash-tokens diff');
      } finally { rmSync(r.dir, { recursive: true, force: true }); }
    });
  }
});
