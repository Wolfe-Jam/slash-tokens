import { patchFetch, onIntercept } from './intercept.js';
import { report } from './transact.js';
import { hasKey } from './config.js';

// Auto mode: import this file and every LLM call is pre-flighted.
// Usage: import 'slash-tokens/auto'
//
// No key: console logging only (free forever)
// With key (init or SLASH_KEY): flight records sent to API
//
// Auto mode observes every call — it doesn't block.
// The data shows what you're spending and what you COULD save.
// When you start acting on preflight results (skip/reduce/route),
// the savings become real.

patchFetch();

onIntercept((event) => {
  const status = event.fits ? 'OK' : 'OVER LIMIT';
  console.log(
    `[slash] ${event.provider} ${event.model} | ${event.tokens.toLocaleString()} tokens | $${event.cost.toFixed(4)} | ${status}`
  );

  // If key is configured, log the flight record (non-blocking)
  if (hasKey() && event.tokens > 0) {
    report({
      tokens_estimated: event.tokens,
      tokens_saved: 0,
      model: event.model,
      action: 'routed',
      cost_saved_usd: 0,
    }).catch(() => {
      // Silent — never break the app for billing failures
    });
  }
});
