import { CallSite } from './scanner';

// ANSI — zero deps
const R = '\x1b[0m';
const B = '\x1b[1m';
const DIM = '\x1b[2m';
const ORANGE = '\x1b[38;2;255;68;0m';
const GOLD = '\x1b[38;2;230;161;65m';
const WHITE = '\x1b[97m';
const GRAY = '\x1b[90m';

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function printReport(sites: CallSite[], filesScanned: number, timeMs: number, cwd: string): void {
  console.log('');
  console.log(`${ORANGE}${B}  ⚡ /slash${R}`);
  console.log(`${GRAY}  Token burn analysis${R}`);
  console.log('');
  console.log(`${DIM}  Scanned ${filesScanned} files in ${timeMs}ms${R}`);
  console.log('');

  if (sites.length === 0) {
    console.log(`${WHITE}  No AI API call sites detected.${R}`);
    console.log(`${GRAY}  Supported: OpenAI, Anthropic, Vercel AI, LangChain, Gemini, Bedrock, Grok${R}`);
    console.log('');
    return;
  }

  // Call sites
  console.log(`${ORANGE}  CALL SITES${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);

  for (const site of sites) {
    const loc = site.file.replace(cwd + '/', '') + ':' + site.line;
    console.log(`${WHITE}  ${pad(loc, 40)} ${GOLD}${pad(site.sdk, 12)} ${ORANGE}~${formatNum(site.tokensPerCall)} tok/call${R}`);
  }

  console.log('');

  // Daily estimates (100 calls/site/day)
  const callsPerDay = 100;
  const dailyInput = sites.reduce((sum, s) => sum + s.tokensPerCall * callsPerDay, 0);
  const dailyOutput = dailyInput * 2; // Estimate output at 2x input
  const dailyTotal = dailyInput + dailyOutput;
  const monthlyTotal = dailyTotal * 30;

  // Cost at $3/MTok input, $15/MTok output (GPT-4o class)
  const monthlyCostInput = (dailyInput * 30 / 1_000_000) * 3;
  const monthlyCostOutput = (dailyOutput * 30 / 1_000_000) * 15;
  const monthlyCost = monthlyCostInput + monthlyCostOutput;

  console.log(`${ORANGE}  DAILY BURN ${GRAY}(${callsPerDay} calls/site/day)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Input tokens:    ${B}${formatNum(dailyInput)}${R}`);
  console.log(`${WHITE}  Output tokens:   ${B}${formatNum(dailyOutput)}${R}  ${GRAY}(estimated)${R}`);
  console.log(`${WHITE}  Total:           ${ORANGE}${B}${formatNum(dailyTotal)} tokens/day${R}`);
  console.log('');

  console.log(`${ORANGE}  MONTHLY COST ${GRAY}($3/$15 per MTok)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Input:           ${B}$${monthlyCostInput.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Output:          ${B}$${monthlyCostOutput.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Total:           ${ORANGE}${B}$${monthlyCost.toFixed(2)}/mo${R}`);
  console.log('');

  // Slash savings (conservative 10% gate savings)
  const savingsPct = 10;
  const monthlySaved = monthlyCost * savingsPct / 100;
  console.log(`${GOLD}  ⚡ SLASH SAVINGS ${GRAY}(${savingsPct}% gate efficiency)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Monthly savings: ${GOLD}${B}$${monthlySaved.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Annual savings:  ${GOLD}${B}$${(monthlySaved * 12).toFixed(2)}/yr${R}`);
  console.log('');

  console.log(`${GRAY}  4.8 KB WASM · sub-ms · zero deps${R}`);
  console.log(`${GRAY}  → ${ORANGE}slashtokens.com${R}`);
  console.log('');
}
