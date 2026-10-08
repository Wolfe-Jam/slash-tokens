#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from './scanner.js';
import { printReport } from './report.js';
import { init } from './config.js';
import { quote, decide } from './quote.js';
import type { Tier } from './catalog.js';

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-V')) {
  console.log(packageVersion());
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args[0] === 'quote') {
  runQuote(args.slice(1)).then(code => process.exit(code));
} else {
  scanHere();
}

function scanHere(): void {
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
}

/** `--name value` or `--name=value`. */
function flag(argv: string[], name: string): string | undefined {
  const eq = argv.find(a => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

function num(argv: string[], name: string): number | undefined {
  const v = flag(argv, name);
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`--${name} must be a non-negative number, got "${v}"`);
  return n;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * slash-tokens quote --model M [--file F | --text T | stdin]
 *   [--max-output N] [--min-output N] [--budget USD] [--floor 1-4] [--json]
 * Prints the quote and the decision. Exit 0 on go/downgrade/block (read
 * `action`), 1 on bad input.
 */
async function runQuote(argv: string[]): Promise<number> {
  try {
    const model = flag(argv, 'model');
    if (!model) throw new Error('--model is required');
    const file = flag(argv, 'file');
    const text = flag(argv, 'text');
    const input = file !== undefined ? readFileSync(file, 'utf8')
      : text !== undefined ? text
      : !process.stdin.isTTY ? await readStdin()
      : undefined;
    if (input === undefined) throw new Error('give the prompt with --file, --text or stdin');

    const floor = num(argv, 'floor');
    if (floor !== undefined && ![1, 2, 3, 4].includes(floor)) throw new Error('--floor must be 1, 2, 3 or 4');
    const task = { input, model, maxOutputTokens: num(argv, 'max-output'), minOutputTokens: num(argv, 'min-output') };
    const q = quote(task);
    const d = decide(task, { budget: num(argv, 'budget'), floor: floor as Tier | undefined });

    if (argv.includes('--json')) {
      console.log(JSON.stringify({ quote: q, decision: d }, null, 2));
      return 0;
    }
    const usd = (n: number) => `$${n.toFixed(6)}`;
    console.log(`${q.model} (${q.provider}, tier ${q.tier}) — prices as of ${q.asOf}`);
    console.log(`  input   ${q.inputTokens} tokens`);
    console.log(`  output  ${q.outputTokens.min}–${q.outputTokens.max} tokens${q.outputAssumed ? ' (assumed ceiling; set --max-output)' : ''}`);
    console.log(`  cost    ${usd(q.cost.low)} – ${usd(q.cost.high)}${q.fits ? '' : '  (does not fit the context window)'}`);
    console.log(`${d.action.toUpperCase()}${d.chosen && d.chosen.model !== q.model ? ` → ${d.chosen.model}, up to ${usd(d.chosen.cost.high)} (saves ${usd(d.saved)})` : ''}`);
    console.log(`  ${d.reason}`);
    return 0;
  } catch (err) {
    console.error(`slash-tokens quote: ${(err as Error).message}`);
    return 1;
  }
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

  slash-tokens quote --model M [--file F | --text T | stdin]
      [--max-output N] [--min-output N] [--budget USD] [--floor 1-4] [--json]
                             price a job and decide: go, downgrade or block

  --version, -V    print version and exit
  --help, -h       print this help and exit
  --key=KEY        optional; CLI scans never charge

Run in a project that already calls an LLM.
Empty folder → no call sites. That's normal.`);
}
