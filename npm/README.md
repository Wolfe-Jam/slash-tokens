# /slash-tokens

Token Optimization for Context Engineers.
For anyone building with LLMs. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

```bash
npm install slash-tokens
```

```js
import { preflight } from 'slash-tokens'

const check = preflight(prompt, 'claude-opus')
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
