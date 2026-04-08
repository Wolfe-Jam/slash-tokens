#!/usr/bin/env node

import { scan } from './scanner.js';
import { printReport } from './report.js';
import { report } from './transact.js';
import { init } from './config.js';

// Parse --key=xxx from args
const args = process.argv.slice(2);
const keyArg = args.find(a => a.startsWith('--key='));
const key = keyArg?.split('=')[1] || process.env.SLASH_KEY;

if (key) init({ key });

const cwd = process.cwd();
const { sites, filesScanned, timeMs } = scan(cwd);
printReport(sites, filesScanned, timeMs, cwd);

// ANSI
const R = '\x1b[0m';
const B = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[38;2;74;222;128m';
const GOLD = '\x1b[38;2;230;161;65m';
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
