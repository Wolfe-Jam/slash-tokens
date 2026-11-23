/**
 * npm publishes through OIDC Trusted Publishing (from 1.8.2).
 * A published GitHub release runs publish-npm.yml: no npm token in the repo,
 * id-token write, environment npm (the Trusted Publisher setting on npmjs.com
 * names this file and that environment). A version already on npm is skipped.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const wf = readFileSync(join(import.meta.dir, '..', '..', '.github', 'workflows', 'publish-npm.yml'), 'utf-8');

describe('publish-npm.yml (OIDC Trusted Publishing)', () => {
  it('runs on a published release, in environment npm, with id-token write and no token', () => {
    expect(wf).toMatch(/release:\n\s+types: \[published\]/);
    expect(wf).toMatch(/\n\s+environment: npm\n/);
    expect(wf).toMatch(/id-token: write/);
    expect(wf).not.toMatch(/NPM_TOKEN|_authToken|secrets\./);
    expect(wf).toContain('unset NODE_AUTH_TOKEN');
    expect(wf).toContain("node-version: '24.x'"); // npm 11.5.1+ for Trusted Publishing
  });

  it('publishes from npm/, after the tests, and skips a version already on npm', () => {
    expect(wf).toMatch(/working-directory: npm/);
    expect(wf.indexOf('run: bun test')).toBeLessThan(wf.indexOf('npm publish --access public'));
    expect(wf).toContain('registry.npmjs.org/slash-tokens/${VER}');
    expect(wf).toContain("if: steps.exists.outputs.skip != 'true'");
  });
});
