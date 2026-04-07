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

if (key && sites.length > 0) {
  // Calculate sunk cost recovery from scan
  const callsPerDay = 100;
  const dailyInput = sites.reduce((sum, s) => sum + s.tokensPerCall * callsPerDay, 0);
  const dailyOutput = dailyInput * 2;
  const monthlyCostInput = (dailyInput * 30 / 1_000_000) * 3;
  const monthlyCostOutput = (dailyOutput * 30 / 1_000_000) * 15;
  const monthlyCost = monthlyCostInput + monthlyCostOutput;
  const monthlyRecovered = monthlyCost * 0.10;

  report({
    tokens_estimated: dailyInput * 30,
    tokens_saved: Math.round(dailyInput * 30 * 0.10),
    model: 'scan',
    action: 'reduced',
    cost_saved_usd: monthlyRecovered,
  })
    .then(result => {
      console.log(`${GREEN}${B}  ✓ Reported to MCPaaS${R} ${GRAY}(${result.transaction_id})${R}`);
      console.log(`${GRAY}    Fee: $${result.fee_usd.toFixed(4)} · Balance: $${result.balance_remaining_usd.toFixed(2)}${R}`);
      console.log('');
    })
    .catch(err => {
      console.log(`${GOLD}  ⚠ Report failed: ${err.message}${R}`);
      console.log('');
    });
} else if (!key && sites.length > 0) {
  console.log(`${GRAY}  → Track salvaged: ${ORANGE}bunx slash-tokens --key=YOUR_KEY${R}`);
  console.log(`${GRAY}  → Get a key:      POST https://mcpaas.live/api/slash/register${R}`);
  console.log('');
}
