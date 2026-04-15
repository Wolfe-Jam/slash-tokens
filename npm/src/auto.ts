import { patchFetch, onIntercept } from './intercept.js';
import { report } from './transact.js';
import { hasKey, isQuiet } from './config.js';

// Auto mode: import this file and every LLM call is optimized.
// Usage: import 'slash-tokens/auto'
//
// Silent by default. Routes to cheapest model within same provider.
// Tracks cumulative savings. Nudges at thresholds.
//
// No key: routing still works (free forever), no dashboard tracking
// With key (init or SLASH_KEY): savings reported to MCPaaS

// Session state
let totalSalvaged = 0;
let totalCalls = 0;
let totalRouted = 0;
let nextNudge = 5; // First nudge at $5

// ANSI
const R = '\x1b[0m';
const B = '\x1b[1m';
const GREEN = '\x1b[38;2;74;222;128m';
const GOLD = '\x1b[38;2;230;161;65m';
const DIM = '\x1b[2m';

// Session summary on exit — print total saved when the process ends
function printSummary() {
  if (totalCalls === 0) return;
  const savedStr = totalSalvaged > 0 ? `${GREEN}${B}$${totalSalvaged.toFixed(4)} salvaged${R}` : `$0 salvaged`;
  const routedStr = totalRouted > 0 ? ` | ${GOLD}${totalRouted} routed${R}` : '';
  console.log(`\n${GREEN}[slash]${R} Session: ${totalCalls} calls${routedStr} | ${savedStr} ${DIM}— The more you build, the more you save${R}`);
}

if (typeof process !== 'undefined') {
  process.once('exit', printSummary);
  process.once('SIGINT', () => { printSummary(); process.exit(0); });
  process.once('SIGTERM', () => { printSummary(); process.exit(0); });
}

patchFetch();

onIntercept((event) => {
  totalCalls++;
  totalSalvaged += event.salvaged;

  if (event.routed) {
    totalRouted++;
  }

  // Verbose mode (default) — log every call
  if (!isQuiet()) {
    const route = event.routed
      ? `${GOLD}${event.originalModel} → ${event.model}${R}`
      : `${event.model}`;
    const salvageTag = event.salvaged > 0 ? ` ${GREEN}saved $${event.salvaged.toFixed(4)}${R}` : '';
    console.log(`${GREEN}[slash]${R} ${event.provider} ${route} | ${event.tokens.toLocaleString()} tok | $${event.cost.toFixed(4)}${salvageTag}`);
  }

  // Nudge at thresholds (always, even in quiet mode)
  if (totalSalvaged >= nextNudge) {
    console.log(`${GREEN}${B}  ⚡ $${Math.floor(totalSalvaged)} salvaged${R}${GOLD} — keep building${R}`);
    if (nextNudge < 10) nextNudge = 10;
    else if (nextNudge < 25) nextNudge = 25;
    else if (nextNudge < 50) nextNudge = 50;
    else if (nextNudge < 100) nextNudge = 100;
    else nextNudge += 100;
  }

  // Report real savings to MCPaaS (non-blocking)
  if (hasKey() && event.salvaged > 0) {
    report({
      tokens_estimated: event.tokens,
      tokens_saved: event.tokens,
      model: event.originalModel,
      action: 'routed',
      cost_saved_usd: event.salvaged,
    }).catch(() => {});
  }
});
