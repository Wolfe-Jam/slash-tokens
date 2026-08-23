import { CallSite } from './scanner.js';
import { getModel } from './models.js';
import { UNKNOWN_SDK_REPRESENTATIVE_MODEL } from './patterns.js';

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
  console.log(`${GRAY}  Token optimization analysis${R}`);
  console.log('');
  console.log(`${DIM}  Evaluated ${filesScanned} files in ${timeMs}ms${R}`);
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

  // Cost per site using its own representative model's REAL current price
  // (see patterns.ts SDK_REPRESENTATIVE_MODEL) — fixed 2026-08-23: this
  // used to be one flat hardcoded $3/$15 "GPT-4o class" rate applied to
  // every site regardless of detected provider, understating cost by up
  // to ~67% for premium providers and overstating it for cheap ones.
  let monthlyCostInput = 0;
  let monthlyCostOutput = 0;
  let unknownProviderSites = 0;
  for (const site of sites) {
    const info = getModel(site.estimatedModel);
    if (!info) continue; // shouldn't happen — estimatedModel always maps to a real MODELS entry
    if (site.estimatedModel === UNKNOWN_SDK_REPRESENTATIVE_MODEL && !['Anthropic'].includes(site.sdk)) {
      unknownProviderSites++;
    }
    const siteDailyInput = site.tokensPerCall * callsPerDay;
    const siteDailyOutput = siteDailyInput * 2;
    monthlyCostInput += (siteDailyInput * 30 / 1_000_000) * info.input;
    monthlyCostOutput += (siteDailyOutput * 30 / 1_000_000) * info.output;
  }
  const monthlyCost = monthlyCostInput + monthlyCostOutput;

  console.log(`${ORANGE}  DAILY TOKEN VOLUME ${GRAY}(${callsPerDay} calls/site/day)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Input tokens:    ${B}${formatNum(dailyInput)}${R}`);
  console.log(`${WHITE}  Output tokens:   ${B}${formatNum(dailyOutput)}${R}  ${GRAY}(estimated)${R}`);
  console.log(`${WHITE}  Total:           ${ORANGE}${B}${formatNum(dailyTotal)} tokens/day${R}`);
  console.log('');

  console.log(`${ORANGE}  MONTHLY COST ${GRAY}(real per-provider pricing)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Input:           ${B}$${monthlyCostInput.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Output:          ${B}$${monthlyCostOutput.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Total:           ${ORANGE}${B}$${monthlyCost.toFixed(2)}/mo${R}`);
  if (unknownProviderSites > 0) {
    console.log(`${GRAY}  (${unknownProviderSites} call site${unknownProviderSites === 1 ? '' : 's'} use an assumed price — the detected SDK doesn't reveal the exact provider)${R}`);
  }
  console.log('');

  // Slash — sunk cost recovery (conservative 10% gate efficiency)
  const recoveryPct = 10;
  const monthlyRecovered = monthlyCost * recoveryPct / 100;
  console.log(`${GOLD}  ⚡ TOKENS SALVAGED ${GRAY}(${recoveryPct}% gate efficiency)${R}`);
  console.log(`${DIM}  ${'─'.repeat(60)}${R}`);
  console.log(`${WHITE}  Monthly salvaged: ${GOLD}${B}$${monthlyRecovered.toFixed(2)}/mo${R}`);
  console.log(`${WHITE}  Annual salvaged:  ${GOLD}${B}$${(monthlyRecovered * 12).toFixed(2)}/yr${R}`);
  console.log('');

  console.log(`${GRAY}  4.8 KB WASM · sub-ms · zero deps${R}`);
  console.log(`${GRAY}  → ${ORANGE}slashtokens.com${R}`);
  console.log('');
}
