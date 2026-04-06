import { patchFetch, onIntercept } from './intercept.js';

// Auto mode: import this file and every LLM call is pre-flighted.
// Usage: import 'slash-tokens/auto'

patchFetch();

// Default handler: log to console
onIntercept((event) => {
  const status = event.fits ? 'OK' : 'OVER LIMIT';
  console.log(
    `[slash] ${event.provider} ${event.model} | ${event.tokens.toLocaleString()} tokens | $${event.cost.toFixed(4)} | ${status}`
  );
});
