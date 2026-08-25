# /slash-tokens

[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![WASM size](https://img.shields.io/badge/WASM-4.8_KB-blue?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/github/license/Wolfe-Jam/slash-tokens?style=flat)](./LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
For anyone building with LLMs. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

Know the cost before the call leaves your machine.

Models change. Windows grow. Slash adapts — you keep building.
Cheaper tokens haven't shrunk the bill — usage has.

Current: [slash-tokens@1.6.3](https://www.npmjs.com/package/slash-tokens) · [release notes](https://github.com/Wolfe-Jam/slash-tokens/releases/tag/v1.6.3)

## Try it

```bash
bunx slash-tokens
# or: npx --yes slash-tokens
```

Run it in a project that already calls an LLM. An empty folder prints that nothing was found — that's normal.

See it work in a chat: [live demo](https://slash-nextjs-wofejams-projects.vercel.app)

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

`preflight` is analysis (every cheaper model, all providers). `preflightRoute` is the routing decision — same provider only. They answer different questions.

```js
import { preflight, preflightRoute } from 'slash-tokens'

const prompt = 'Your prompt here...'

const check = preflight(prompt, 'claude-opus-4.7')
check.tokens       // estimated tokens
check.cost         // USD at the input rate
check.fits         // under this model's context window?
check.options      // cheaper models across providers — not a route

const route = preflightRoute(prompt, 'claude-opus-4.7')
// cheapest same-provider alternative, or null
// e.g. { model: 'claude-haiku', cost, salvaged, salvagePercent }
```

Fully typed. Do not use `check.options[0]` as the route — that list is cross-provider on purpose.

## Token estimation

The engine underneath. 4.8 KB Zig-compiled WASM, calibrated against real provider tokenizers — not a flat chars/4 guess.

```js
import { slash, slashBytes } from 'slash-tokens'

slash('Hello world')            // 2
slash(longDocument)             // 47283
slashBytes(new Uint8Array(buf)) // skip TextEncoder
```

Safe pre-check, not a perfect count. Pre-call, you only need go/no-go.

## Models

11 with built-in pricing (as of 1.6.3). Don't see yours? [Open an issue.](https://github.com/Wolfe-Jam/slash-tokens/issues)

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

Optional. `bunx` is the try path — no account.

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

Hosted dashboard is ordinary SaaS: $39/mo or $390/yr for the data, not a cut of savings. One-person key: [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup)

## Runtime support

Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, Browser.

## Testing

TypeScript SDK tests via `cd npm && bun test`. Zig coverage includes adversarial cases (CJK, emoji, binary, base64, thresholds).

## Links

- [slashtokens.com](https://slashtokens.com)
- [npm](https://www.npmjs.com/package/slash-tokens)
- [Dashboard](https://mcpaas.live/slash/dashboard)
- [Changelog](./npm/CHANGELOG.md)

## License

**Code: MIT.** Fork it, ship it, change it, show it, share it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash. See [NOTICE](./NOTICE).

---

🏎️ *Don't go to the Corner Shop in a Ferrari.*
