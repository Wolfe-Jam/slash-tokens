#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from './scanner.js';
import { printReport } from './report.js';
import { init } from './config.js';

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-V')) {
  console.log(packageVersion());
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const keyArg = args.find(a => a.startsWith('--key='));
const key = keyArg?.split('=')[1] || process.env.SLASH_KEY;

if (key) init({ key });

const cwd = process.cwd();
const { sites, filesScanned, timeMs } = scan(cwd);
printReport(sites, filesScanned, timeMs, cwd);

const R = '\x1b[0m';
const B = '\x1b[1m';
const GREEN = '\x1b[38;2;74;222;128m';
const GRAY = '\x1b[90m';
const ORANGE = '\x1b[38;2;255;68;0m';

if (sites.length > 0) {
  if (key) {
    console.log(`${GREEN}${B}  ✓ Key active${R} ${GRAY}— evaluation complete, no charges on CLI scans${R}`);
    console.log(`${GRAY}  → Dashboard: ${ORANGE}https://mcpaas.live/slash/dashboard${R}`);
  } else {
    console.log(`${GRAY}  → Next: ${ORANGE}https://mcpaas.live/slash/setup${R}`);
  }
  console.log('');
}

function packageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
  return pkg.version as string;
}

function printHelp(): void {
  console.log(`slash-tokens — Token Optimization for Context Engineers

  bunx slash-tokens          try (scan this directory, no account)
  npm install slash-tokens   SDK

  --version, -V    print version and exit
  --help, -h       print this help and exit
  --key=KEY        optional; CLI scans never charge

Run in a project that already calls an LLM.
Empty folder → no call sites. That's normal.`);
}
