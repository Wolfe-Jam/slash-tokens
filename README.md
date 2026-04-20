# /slash-tokens

[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![bundle size](https://img.shields.io/bundlephobia/minzip/slash-tokens?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens?style=flat)](./npm/LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
4.8 KB WASM. Sub-millisecond. Zero dependencies.

Know the cost before the call leaves your machine.

> 🆕 **v1.4 — The Single-Source-of-Truth Edition.** New `preflightRoute()` matches the Slash proxy exactly — same-provider only, zero routing drift. `PROVIDER_MODELS` is now the single source of truth across the SDK.
>
> **v1.3 — The Opus 4.7 Edition.** Same-day support for Claude Opus 4.7 with measured token calibration (1.16–1.51x). Plus Gemini proxy fix and benchmark harness for any upstream.

## Try it

```bash
bunx slash-tokens
```

## Install

```bash
npm install slash-tokens
```

```bash
bun add slash-tokens
```

## Auto mode

One import. Every LLM call checked pre-call.

```js
import 'slash-tokens/auto'
```

Intercepts `fetch()` to Anthropic, OpenAI, xAI, and Google endpoints. Estimates tokens before the call leaves your machine. Sub-millisecond. Non-blocking.

```
[slash] Anthropic claude-sonnet | 47,000 tokens | $0.1410 | OK
[slash] xAI grok-4.20 | 12,300 tokens | $0.0246 | OK
```

## Pre-call check

```js
import { preflight } from 'slash-tokens'

const check = preflight('Your prompt here...', 'claude-opus-4.7')

check.tokens       // 47000
check.cost         // 0.235 (USD)
check.fits         // true
check.options[0]   // { model: 'grok-4-1-fast', cost: 0.0094, savings: 0.2256, savingsPercent: 96 }
```

Fully typed. Returns tokens, cost, context fit, and cheaper alternatives sorted by price.

## Token estimation

The engine underneath. 4.8 KB Zig-compiled WASM. 96-98% accurate.

```js
import { slash, slashBytes } from 'slash-tokens'

slash('Hello world')           // 2
slash(longDocument)            // 47283
slashBytes(new Uint8Array(buf)) // skip TextEncoder
```

Overestimates by design. The margin prevents overflow. Pre-call, you only need go/no-go.

## Models

Works with all models. 10 with built-in pricing (as of April 2026). Don't see yours? [Open an issue.](https://github.com/Wolfe-Jam/slash-tokens/issues)

| Model | $/M input | $/M output | Context |
|---|---|---|---|
| claude-opus-4.7 | 5.00 | 25.00 | 1M |
| claude-opus | 5.00 | 25.00 | 1M |
| claude-sonnet | 3.00 | 15.00 | 1M |
| claude-haiku | 1.00 | 5.00 | 200K |
| grok-4.20 | 2.00 | 6.00 | 2M |
| grok-4-1-fast | 0.20 | 0.50 | 2M |
| gemini-3.1-pro | 2.00 | 12.00 | 1M |
| gemini-2.5-flash | 0.30 | 2.50 | 1M |
| gpt-5.4 | 2.50 | 15.00 | 1M |
| gpt-5.4-mini | 0.75 | 4.50 | 128K |
| gpt-5.4-nano | 0.20 | 1.25 | 128K |

```js
import { listModels, MODELS } from 'slash-tokens'

listModels()           // ['claude-opus', 'claude-sonnet', ...]
MODELS['claude-opus']  // { input: 5, output: 25, context: 1000000 }
```

## Savings reporting

```js
import { init, report } from 'slash-tokens'

init({ key: 'mcp_slash_xxx' })

const result = await report({
  tokens_estimated: 47000,
  tokens_saved: 47000,
  model: 'claude-opus',
  action: 'skipped',        // 'skipped' | 'reduced' | 'routed'
  cost_saved_usd: 0.235
})
```

Register at [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup) to start tracking.

## Runtime support

Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, Browser.

## Testing

323 tests:
- 172 Zig (65 adversarial: CJK, emoji, binary, base64, thresholds)
- 103 TypeScript (SDK, preflight, billing, auto mode)
- 50 API (transaction lifecycle, auth, injection, key format attacks)

## Links

- [slashtokens.com](https://slashtokens.com)
- [npm](https://www.npmjs.com/package/slash-tokens)
- [Dashboard](https://mcpaas.live/slash/dashboard)

## Brand

By using the SDK, you agree not to use the ⚡slash-tokens brand or colors for your app without written consent. Violators will get a takedown request issued immediately.

## License

MIT
