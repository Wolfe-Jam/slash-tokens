import { patchFetch, onIntercept } from './intercept.js';
import { report } from './transact.js';
import { hasKey } from './config.js';

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

patchFetch();

onIntercept((event) => {
  totalCalls++;
  totalSalvaged += event.salvaged;

  if (event.routed) {
    totalRouted++;
  }

  // Nudge at thresholds: $5, $10, $25, $50, $100, $250, $500, $1000...
  if (totalSalvaged >= nextNudge) {
    console.log(`${GREEN}${B}  ⚡ $${Math.floor(totalSalvaged)} salvaged${R}${GOLD} — keep building${R}`);
    // Next threshold
    if (nextNudge < 10) nextNudge = 10;
    else if (nextNudge < 25) nextNudge = 25;
    else if (nextNudge < 50) nextNudge = 50;
    else if (nextNudge < 100) nextNudge = 100;
    else nextNudge += 100;
  }

  // Report real savings to MCPaaS (non-blocking, silent)
  if (hasKey() && event.salvaged > 0) {
    report({
      tokens_estimated: event.tokens,
      tokens_saved: event.tokens,
      model: event.originalModel,
      action: 'routed',
      cost_saved_usd: event.salvaged,
    }).catch(() => {
      // Silent — never break the app
    });
  }
});
