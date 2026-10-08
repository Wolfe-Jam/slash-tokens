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

Current: [slash-tokens@1.7.0](https://www.npmjs.com/package/slash-tokens) · [release notes](https://github.com/Wolfe-Jam/slash-tokens/releases/tag/v1.7.0) · The Hired Agent Edition: quote the job, book the right model, prove it with a receipt.

## Try it

```bash
bunx slash-tokens
# or: npx --yes slash-tokens
```

Run it in a project that already calls an LLM. An empty folder prints that nothing was found, then tells you to run it in an app — that's normal. `--version` / `--help` print and exit (they do not scan).

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
[slash] Anthropic claude-sonnet-5 | 47,000 tokens | $0.0940 | OK
[slash] xAI grok-4.6 | 12,300 tokens | $0.0246 | OK
```

## Pre-call check

`preflight` is analysis (every cheaper model, all providers). `preflightRoute` is the routing decision — same provider only. They answer different questions.

```js
import { preflight, preflightRoute } from 'slash-tokens'

const prompt = 'Your prompt here...'

const check = preflight(prompt, 'claude-opus-5')
check.tokens       // estimated tokens
check.cost         // USD at the input rate
check.fits         // under this model's context window?
check.options      // cheaper models across providers — not a route

const route = preflightRoute(prompt, 'claude-opus-5')
// cheapest same-provider alternative, or null
// e.g. { model: 'claude-haiku', cost, salvaged, salvagePercent }
```

Fully typed. Do not use `check.options[0]` as the route — that list is cross-provider on purpose.

## Quote → Decide → Prove

Price a job before it runs, choose the model under a budget and a quality floor, and check the bill afterwards.

```js
import { quote, decide, reconcile } from 'slash-tokens'

const task = { input: prompt, model: 'claude-opus-5', maxOutputTokens: 2000 }

quote(task)
// { inputTokens, outputTokens: { min, max }, cost: { low, high }, fits, tier, asOf }

const d = decide(task, { budget: 0.05, floor: 2 })
// d.action: 'go' | 'downgrade' | 'block'   d.chosen: the model to run   d.saved

// after the call, with the provider's own usage object:
const receipt = reconcile(d.chosen, response.usage, { baseline: 'claude-opus-5' })
// receipt.actual.cost · receipt.withinQuote · receipt.underReported · receipt.saved · receipt.fee
```

- **Tiers** are each vendor's own line: 1 small · 2 mid · 3 flagship · 4 frontier. A floor compares models within one provider only. The default floor is the requested model's own tier.
- **`decide()` never raises the bill**: a substitute always costs less than the model you asked for, and it stays with the same provider.
- **`reconcile()`** reads OpenAI-style usage (OpenAI, xAI, Nebius, any OpenAI-compatible API) and Anthropic-style usage. `underReported` flags the one thing Slash must never do.

## Hire the agent

`hire()` runs the whole loop for each job: quote → decide → your call → receipt. One budget covers every job; a blocked job never calls the model.

```js
import { hire } from 'slash-tokens'

const agent = hire({ budget: 0.50, floor: 2, baseline: 'nemotron-3-ultra' })
const { decision, output, receipt } = await agent.run({ input, model: 'nemotron-3-ultra', maxOutputTokens: 2000, call })
agent.spent · agent.remaining · agent.receipts
```

The agent's fee is 10% of measured savings against your baseline. It's on every receipt, waived, and never charged on a loss.

```bash
slash-tokens quote --model nemotron-3-ultra --file prompt.txt --max-output 2000 --budget 0.01 --floor 2 --json
```

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

Prices as of 2026-10-07, checked against each provider's pricing page. Real API IDs work as written (`claude-opus-4-7`, `claude-sonnet-4-5-20250929`). Generic aliases (`claude-opus`, `gpt-5.4`, `grok-4.20`, …) still resolve. `listModels()` has the full list. Don't see yours? [Open an issue.](https://github.com/Wolfe-Jam/slash-tokens/issues)

| Model | $/M input | $/M output | Context |
|---|---|---|---|
| claude-fable-5.1 | 10.00 | 50.00 | 1M |
| claude-opus-5.5 | 4.00 | 20.00 | 1M |
| claude-opus-5 | 5.00 | 25.00 | 1M |
| claude-sonnet-5.5 | 2.00 | 10.00 | 1M |
| claude-haiku-4.5 | 1.00 | 5.00 | 200K |
| grok-4.7 | 2.00 | 6.00 | 500K |
| grok-4.3 | 1.25 | 2.50 | 1M |
| gemini-3.1-pro | 2.00 | 12.00 | 1M |
| gemini-3.8-flash | 0.75 | 3.75 | 1M |
| gemini-3.1-flash-lite | 0.25 | 1.50 | 1M |
| gpt-6-astra | 10.00 | 50.00 | 1.05M |
| gpt-6.1-sol | 2.00 | 10.00 | 1.05M |
| gpt-6-luna | 0.10 | 0.50 | 1.05M |
| gpt-5.6-sol | 4.00 | 20.00 | 1.05M |
| nemotron-3-ultra | 1.00 | 3.00 | 1M |
| nemotron-3-super | 0.30 | 0.90 | 262K |
| nemotron-3-nano | 0.06 | 0.24 | 262K |
| nemotron-3.5-lightning | 0.06 | 0.24 | 1M |

Gemini 3.6–3.8 Flash are at their launch price; Google lists $1.50 / $7.50 from 2027-01-01. Nemotron is NVIDIA's, served and billed by Nebius Token Factory; prices and context windows as its API reports them (2026-10-08), and Nebius IDs such as `nvidia/Nemotron-3_5-Lightning` work as written. `CATALOG` adds each model's provider, tier and `asOf` date; a weekly check fails when a price is over 30 days old.

```js
import { listModels, MODELS } from 'slash-tokens'

listModels()
MODELS['grok-4.6']  // { input: 2, output: 6, context: 500000, ... }
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
  action: 'prevented',      // 'prevented' | 'routed' | 'pass'
  cost_saved_usd: 0.235
})
```

Hosted dashboard is ordinary SaaS: $39/mo or $390/yr for the data, not a cut of savings. One-person key: [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup)

## Runtime support

Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, Browser.

## Testing

TypeScript SDK tests via `cd npm && bun test`; every test file also passes on its own. An accuracy gate fails CI if any calibrated estimate falls below the real count on the 29-sample corpus (Claude, Gemini, Grok, GPT, Nemotron). Zig coverage includes adversarial cases (CJK, emoji, binary, base64, thresholds).

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
