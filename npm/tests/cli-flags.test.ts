/**
 * Flags print-and-exit (since 1.6.6); empty scan names where to run.
 * Spawn src AND dist when dist exists so a stale tarball cannot hide.
 */
import { describe, it, expect, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
const SRC = join(here, '../src/cli.ts');
const DIST = join(here, '../dist/cli.js');

const bins: { name: string; cmd: string[] }[] = [
  { name: 'src', cmd: ['bun', SRC] },
];
if (existsSync(DIST)) bins.push({ name: 'dist', cmd: ['node', DIST] });

function tempDir(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'slash-cli-'));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

async function run(bin: string[], args: string[], cwd: string) {
  const proc = Bun.spawn([...bin, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, SLASH_KEY: '' },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* */ }
  }
});

for (const bin of bins) {
  describe(`cli-flags (${bin.name})`, () => {
    it('--version prints package.json version only', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['--version'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
      expect(stdout).not.toContain('CALL SITES');
      expect(stdout).not.toContain('No AI API call sites');
    });

    it('-V matches --version', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['-V'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
    });

    it('--version does not scan a repo with Anthropic sites', async () => {
      const cwd = tempDir({
        'app.ts': `import Anthropic from '@anthropic-ai/sdk'\nconst c = new Anthropic()\n`,
      });
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['--version'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
      expect(stdout).not.toContain('CALL SITES');
      expect(stdout).not.toContain('Anthropic');
    });

    it('--help prints try path and --version, no scan', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['--help'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('bunx slash-tokens');
      expect(stdout).toContain('--version');
      expect(stdout).not.toContain('CALL SITES');
      expect(stdout).not.toContain('No AI API call sites');
    });

    it('-h matches --help', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['-h'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('bunx slash-tokens');
      expect(stdout).not.toContain('CALL SITES');
    });

    it('empty dir scan names where to run, no setup URL', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, [], cwd);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('No AI API call sites detected.');
      expect(stdout).toContain('Run this in a project that already calls an LLM.');
      expect(stdout).not.toContain('mcpaas.live/slash/setup');
    });

    it('empty dir --version is version only, not the empty hint', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['--version'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
      expect(stdout).not.toContain('Run this in a project that already calls an LLM.');
    });

    it('found site, no key, still prints setup URL', async () => {
      const cwd = tempDir({
        'app.ts': `import Anthropic from '@anthropic-ai/sdk'\n`,
      });
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, [], cwd);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('CALL SITES');
      expect(stdout).toContain('mcpaas.live/slash/setup');
    });

    it('--version stdout equals package.json version (lock)', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout } = await run(bin.cmd, ['--version'], cwd);
      expect(stdout.trim()).toBe(pkg.version);
      expect(pkg.version).toBe('1.7.0');
    });

    it('-v is not version (still a scan)', async () => {
      const cwd = tempDir();
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['-v'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).not.toBe(pkg.version);
      expect(stdout).toContain('No AI API call sites detected.');
    });

    it('--version wins over --key= (no scan, no Key active)', async () => {
      const cwd = tempDir({
        'app.ts': `import Anthropic from '@anthropic-ai/sdk'\n`,
      });
      dirs.push(cwd);
      const { stdout, exitCode } = await run(bin.cmd, ['--version', '--key=sk_test_stranger'], cwd);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
      expect(stdout).not.toContain('Key active');
      expect(stdout).not.toContain('CALL SITES');
    });
  });
}
