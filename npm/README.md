# /slash-tokens

[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![WASM size](https://img.shields.io/badge/WASM-4.8_KB-blue?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens?style=flat)](./LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

**Know what an LLM call will cost before you make it, and prove what you saved after.**
4.8 KB WASM · sub-millisecond · zero dependencies · Claude, GPT, Grok, Gemini, Nemotron.

## v1.8.1 — The Merge Gate Edition

Know what a change will cost before it merges.

Count what ships: the scan and diff measure the code you deploy, not your tests. Test files and anything in a `.slashignore` are skipped (`--include-tests` to count tests).

```bash
npx slash-tokens diff main
# LLM cost of this change (scan estimate, 100 calls a site a day)
#   main: 1 call site, $8.71/mo
#   working tree: 2 call sites, $17.29/mo
#   change: +$8.58/mo
#   src/summarise.ts (OpenAI): 0 → 1 site, +$8.58/mo
```

Run it in CI on every merge request (`--json` for pipelines). Also new in 1.8.0: `decide()` never swaps in an older model generation unless you allow it, and `hire()` takes a quality floor per job and tells your client each job's output cap.

## Hire the agent

Quote the job, book the right model, prove it with a receipt.

```js
import { hire } from 'slash-tokens'

const agent = hire({ budget: 0.50, floor: 2 })  // $0.50 to spend; nothing below a mid-tier model

const { decision, receipt } = await agent.run({
  input: prompt,
  model: 'nemotron-3-ultra',
  maxOutputTokens: 2000,
  call: (model, input, { maxOutputTokens }) => yourClient(model, input, maxOutputTokens),  // returns { output, usage }
})

decision.action  // 'downgrade': nemotron-3-super does the job for less
receipt.saved    // dollars saved against the model you asked for
```

- **Quote:** `quote()` prices a job before it runs, low to high.
- **Decide:** `decide()` goes, downgrades or blocks, within your budget and quality floor. Same provider, never a pricier model.
- **Prove:** `reconcile()` checks the quote against what the provider billed.
- **Hire:** `hire()` does all three for every job, inside one budget. Its cut, 10% of measured savings, is on every receipt, waived.

Counts are calibrated against each provider's real tokenizer; models not benchmarked yet (GPT-6) get a conservative default. Quotes add what the provider bills on top of your text, measured on Nebius and a conservative allowance elsewhere. CI fails if a count comes in under the real one, or a quote under a real Nebius bill.

## Install

```bash
npm install slash-tokens
```

## From the terminal

```bash
npx slash-tokens   # find the LLM calls in this project and what they cost a month
echo "Fix the bug" | npx slash-tokens quote --model nemotron-3-ultra --floor 1
npx slash-tokens diff main      # what this branch does to that monthly cost
```

## Check every call, automatically

```js
import 'slash-tokens/auto'
```

Checks each request to Anthropic, OpenAI, xAI and Google before it leaves your machine, and swaps in a cheaper model from the same provider when one fits.

## Per-call checks

```js
import { preflight, preflightRoute } from 'slash-tokens'

const check = preflight(prompt, 'claude-opus-5')       // tokens, cost, fits, cheaper options (all providers)
const route = preflightRoute(prompt, 'claude-opus-5')  // the cheapest same-provider model that fits, or null
```

## Pricing

The library and CLI are free, no account needed. A one-person key is $20 on the house: we show the savings and don't charge. Team is $39/month for the data. [Live demo](https://slash-nextjs-wofejams-projects.vercel.app) · [Get a key](https://mcpaas.live/slash/setup) · [slashtokens.com](https://slashtokens.com) · [Full docs](https://github.com/Wolfe-Jam/slash-tokens)

## License

**Code: MIT.** Fork it, ship it, change it, show it, share it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash. See [NOTICE](./NOTICE).

---

🏎️ *Don't go to the Corner Shop in a Ferrari.* · [slashtokens.com](https://slashtokens.com)
