# /slash-tokens

[![Tests](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Wolfe-Jam/slash-tokens/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/slash-tokens.svg)](https://www.npmjs.com/package/slash-tokens)
[![npm downloads](https://img.shields.io/npm/dm/slash-tokens.svg)](https://www.npmjs.com/package/slash-tokens)
[![bundle size](https://img.shields.io/bundlephobia/minzip/slash-tokens)](https://bundlephobia.com/package/slash-tokens)
[![license](https://img.shields.io/npm/l/slash-tokens.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Wolfe-Jam/slash-tokens?style=social)](https://github.com/Wolfe-Jam/slash-tokens)

Token Optimization for Context Engineers.
For anyone building with LLMs. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

> 🆕 **v1.3 — The Opus 4.7 Edition.** Same-day support for Claude Opus 4.7 with measured token calibration (1.16–1.51x). Plus Gemini proxy fix and benchmark harness for any upstream.

```bash
npm install slash-tokens
```

```js
import { preflight } from 'slash-tokens'

const check = preflight(prompt, 'claude-opus-4.7')
// tokens: 47,000 | cost: $0.71 | 11 cheaper options | save 99%
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

[slashtokens.com](https://slashtokens.com) | MIT
