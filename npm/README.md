# /slash-tokens

[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![WASM size](https://img.shields.io/badge/WASM-4.8_KB-blue?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens?style=flat)](./LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
For anyone building with LLMs. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

Know the cost before the call leaves your machine.

Models change. Windows grow. Slash adapts — you keep building.
Cheaper tokens haven't shrunk the bill — usage has.

## v1.7.0 — The Hired Agent Edition

Quote the job, book the right model, prove it with a receipt.

Solo $20 mailbox, 10% waived. Team $39 for the data.

New in 1.7.0:
- **`quote()`** prices a job before it runs: input tokens, an output band, and a low–high cost.
- **`decide()`** says go, downgrade or block, under your budget and a quality floor. It stays with the same provider and never picks a model that costs more.
- **`reconcile()`** writes the receipt: what was quoted, what the provider billed, and what was saved against the model you asked for.
- **`hire().run()`** is the agent you hire. It does all three for each job, keeps every job inside one budget, and shows its cut: 10% of measured savings, waived.
- **NVIDIA Nemotron on Nebius Token Factory**, counted against the real Nemotron tokenizer.
- **`slash-tokens quote`** on the command line, with `--json` for pipelines.

Earlier: 1.6.7 fixed one very large request (about 1 MB of text) skewing every count after it. 1.6.6 priced Claude 5.5, GPT-6, Grok 4.7 and Gemini 3.8.

**Free forever is bunx** — no account. A one-person account is email → key, **$20 on the house**. We show the savings. We don't charge. 10% is the model, waived. Team is **$39 for the data** (`$390`/year).

```bash
bunx slash-tokens
# or: npx --yes slash-tokens
```

Run it in a project that already calls an LLM. An empty folder prints that nothing was found, then tells you to run it in an app — that's normal. `--version` / `--help` print and exit (they do not scan). Pin proof: `slash-tokens --version` or `npm view slash-tokens version`.

```bash
npm install slash-tokens
```

```js
import { preflight, preflightRoute } from 'slash-tokens'

// Analysis — cheaper alternatives across all providers. Not a route.
const check = preflight(prompt, 'claude-opus-5')
check.tokens
check.cost
check.fits
check.options

// Routing decision — same-provider only, matches the Slash proxy
const route = preflightRoute(prompt, 'claude-opus-5')
// { model: 'claude-haiku', cost, salvaged, salvagePercent } or null
```

Hire the agent — quote, book, run, receipt:

```js
import { hire } from 'slash-tokens'

const agent = hire({ budget: 0.50, floor: 2 })  // $0.50 for the session; nothing below a mid-tier model

const { decision, output, receipt } = await agent.run({
  input: prompt,
  model: 'nemotron-3-ultra',
  maxOutputTokens: 2000,
  call: async (model, input) => myClient(model, input),  // your provider client → { output, usage }
})

decision.action  // 'go' | 'downgrade' | 'block'  (here: downgrade → nemotron-3-super)
receipt.saved    // USD saved against the model you asked for
receipt.fee      // { rate: 0.1, amount, waived: true, charged: 0 }
```

From the terminal:

```bash
echo "Refactor the scorer and add a test." | npx slash-tokens quote --model nemotron-3-ultra --floor 1 --max-output 2000
```

Or one line — every LLM call checked pre-call:

```js
import 'slash-tokens/auto'
```

Intercepts `fetch()` to Anthropic, OpenAI, xAI, and Google. Estimates before the call leaves your machine. Same-provider cheaper swap if one fits.

## See it work

A live chat with every call through the gate: [live demo](https://slash-nextjs-wofejams-projects.vercel.app)

Then `bunx slash-tokens`, [get a key](https://mcpaas.live/slash/setup) ($20 on the house), or [Team — $39 for the data](https://slashtokens.com).

## Dashboard

Track savings across all your apps. One-person key (email, $20 on the house) at [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup)

Full docs, examples, and model pricing at **[GitHub](https://github.com/Wolfe-Jam/slash-tokens)**

## License

**Code: MIT.** Fork it, ship it, change it, show it, share it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash. See [NOTICE](./NOTICE).

---

🏎️ *Don't go to the Corner Shop in a Ferrari.* · [slashtokens.com](https://slashtokens.com)
