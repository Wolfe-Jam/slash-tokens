# /slash-tokens

[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)
[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![WASM size](https://img.shields.io/badge/WASM-4.8_KB-blue?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens?style=flat)](./npm/LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
4.8 KB WASM. Sub-millisecond. Zero dependencies.

Know the cost before the call leaves your machine.

> 🆕 **v1.6.1 — The Fixed Deal Edition.** Team/Pro is the live cart; 10% of savings shows on the weekly number as the comparison, not as what Team is charged.
>
> **v1.5 — The Calibration Fix Edition.** Per-model calibration is now actually wired into every call path (it wasn't — found and fixed 2026-08-23). Unknown models get a safe default instead of zero correction. All four providers (Claude, Gemini, Grok, GPT) are now calibrated against real ground truth and cross-checked on the same 29-sample corpus (expanded same-day from an original 9). The expansion mattered: Claude's factor needed correcting twice in one day (1.85→2.05) once Spanish-language content exposed a real gap, and Gemini needed a smaller bump once a JSON sample did the same — Grok's held unchanged. Several internal model names were also quietly routing to retired API IDs across Claude, Gemini, and Grok — all fixed. A full-codebase review the same day also found `slash()`/`slashBytes()` silently truncated any input above ~1.06 MB before estimating — fixed by growing WASM memory on demand, so large near-context-limit calls are no longer silently under-counted.
>
> **v1.4 — The Single-Source-of-Truth Edition.** New `preflightRoute()` matches the Slash proxy exactly — same-provider only, zero routing drift. `PROVIDER_MODELS` is now the single source of truth across the SDK.
>
> **v1.3 — The Opus 4.7 Edition.** Same-day support for Claude Opus 4.7 with measured token calibration (1.16–1.51x). Plus Gemini proxy fix and benchmark harness for any upstream.

## Try it

```bash
bunx slash-tokens
```

See it work in a chat: [slash-tokens.vercel.app](https://slash-tokens.vercel.app)

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
[slash] Anthropic claude-sonnet | 47,000 tokens | $0.0940 | OK
[slash] xAI grok-4.20 | 12,300 tokens | $0.0154 | OK
```

## Pre-call check

```js
import { preflight } from 'slash-tokens'

const check = preflight('Your prompt here...', 'claude-opus-4.7')

check.tokens       // 47000
check.cost         // 0.235 (USD)
check.fits         // true
check.options[0]   // { model: 'gpt-5.4-nano', cost: 0.0094, savings: 0.2256, savingsPercent: 96 }
```

Fully typed. Returns tokens, cost, context fit, and cheaper alternatives sorted by price.

## Token estimation

The engine underneath. 4.8 KB Zig-compiled WASM, calibrated against real provider tokenizers — not a flat chars/4 guess.

```js
import { slash, slashBytes } from 'slash-tokens'

slash('Hello world')           // 2
slash(longDocument)            // 47283
slashBytes(new Uint8Array(buf)) // skip TextEncoder
```

Overestimates by design. The margin prevents overflow. Pre-call, you only need go/no-go.

## Models

Works with all models. 11 with built-in pricing (as of April 2026). Don't see yours? [Open an issue.](https://github.com/Wolfe-Jam/slash-tokens/issues)

| Model | $/M input | $/M output | Context |
|---|---|---|---|
| claude-opus-4.7 | 5.00 | 25.00 | 1M |
| claude-opus | 5.00 | 25.00 | 1M |
| claude-sonnet | 2.00 | 10.00 | 1M |
| claude-haiku | 1.00 | 5.00 | 200K |
| grok-4.20 | 1.25 | 2.50 | 1M |
| grok-4-1-fast | 1.25 | 2.50 | 1M |
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

Register at [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup) for a one-person key — $20 on the house, emailed.

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

## License

**Code: MIT.** Fork it, ship it, change it, show it, share it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash.

---

🏎️ *Don't go to the Corner Shop in a Ferrari.*
