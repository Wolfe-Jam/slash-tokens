# /slash-tokens

[![CI/CD](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)
[![npm version](https://img.shields.io/npm/v/slash-tokens?style=flat&color=cb3837)](https://www.npmjs.com/package/slash-tokens)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens?style=flat&color=brightgreen)](https://www.npmjs.com/package/slash-tokens)
[![WASM size](https://img.shields.io/badge/WASM-4.8_KB-blue?style=flat)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens?style=flat)](./LICENSE)
[![⭐ Star on GitHub](https://img.shields.io/badge/%E2%AD%90_Star-black?logo=github&logoColor=white)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
For anyone building with LLMs. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

Know the cost before the call leaves your machine.

> 🆕 **v1.6.2 — The Fixed Deal Edition.** Solo $20 mailbox, 10% waived. Teams $5 to join, test the data.
>
> **v1.5 — The Calibration Fix Edition.** Per-model calibration is wired into every call path. All four providers checked against the same 29-sample corpus.
>
> **v1.4 — The Single-Source-of-Truth Edition.** New `preflightRoute()` matches the Slash proxy exactly — same-provider only, zero routing drift. `PROVIDER_MODELS` is now the single source of truth across the SDK.
>
> **v1.3 — The Opus 4.7 Edition.** Same-day support for Claude Opus 4.7 with measured token calibration (1.16–1.51x). Plus Gemini proxy fix and benchmark harness for any upstream.

## v1.6.2 — The Fixed Deal Edition

Solo $20 mailbox, 10% waived. Teams $5 to join, test the data.

**Free forever is bunx** — no account. A one-person account is email → key, **$20 on the house**. We show the savings. We don't charge. 10% is the model, waived. Team is `$5` to join and test the data, then `$39`/month or `$390`/year for the data.

```bash
npm install slash-tokens
```

```js
import { preflight, preflightRoute } from 'slash-tokens'

// Analysis — all cheaper alternatives across all providers
const check = preflight(prompt, 'claude-opus-4.7')
// tokens: 47,000 | cost: $0.71 | 11 cheaper options | save 99%

// Routing decision — matches Slash proxy behavior (same-provider only)
const route = preflightRoute(prompt, 'claude-opus-4.7')
// → { model: 'claude-haiku', cost: 0.14, salvaged: 0.57, ... } or null
```

Or one line — every API call optimized pre-call:

```js
import 'slash-tokens/auto'
```

Every call routed to the cheapest model that can execute it efficiently. Session summary on exit:

```
[slash] Session: 47 calls | 23 routed | $0.89 salvaged — The more you build, the more you save
```

## See it work

A live chat with every call through the gate: [slash-nextjs-wofejams-projects.vercel.app](https://slash-nextjs-wofejams-projects.vercel.app)

Then `bunx slash-tokens`, [get a key](https://mcpaas.live/slash/setup) ($20 on the house), or [Team — $39 for the data](https://slashtokens.com).

## Dashboard

Track savings across all your apps. One-person key (email, $20 on the house) at [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup)

Full docs, examples, and model pricing at **[GitHub](https://github.com/Wolfe-Jam/slash-tokens)**

## License

**Code: MIT.** Fork it, ship it, change it, show it, share it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash.

---

🏎️ *Don't go to the Corner Shop in a Ferrari.* · [slashtokens.com](https://slashtokens.com)
