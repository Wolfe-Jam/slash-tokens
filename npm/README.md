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

> 🆕 **v1.4 — The Single-Source-of-Truth Edition.** New `preflightRoute()` matches the Slash proxy exactly — same-provider only, zero routing drift. `PROVIDER_MODELS` is now the single source of truth across the SDK.
>
> **v1.3 — The Opus 4.7 Edition.** Same-day support for Claude Opus 4.7 with measured token calibration (1.16–1.51x). Plus Gemini proxy fix and benchmark harness for any upstream.

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

## Next.js Starter

One-click deploy with Vercel AI SDK + slash-tokens built in:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Wolfe-Jam/slash-nextjs&project-name=slash-nextjs&env=ANTHROPIC_API_KEY)

→ [slash-nextjs on GitHub](https://github.com/Wolfe-Jam/slash-nextjs)

## Dashboard

Track savings across all your apps. Free key at [mcpaas.live/slash/setup](https://mcpaas.live/slash/setup)

Full docs, examples, and model pricing at **[GitHub](https://github.com/Wolfe-Jam/slash-tokens)**

## License

**Code: MIT.** Fork it, ship it, change it, sell it.

**Brand: reserved.** The slash-tokens name, ⚡ mark, and red/gold colors stay with the project. If you're building on top of the SDK, ship under your own name and colors — don't represent your app as Slash.

---

🏎️ *Don't go to the Corner Shop in a Ferrari.* · [slashtokens.com](https://slashtokens.com)
