# /slash-tokens

Pre-flight checks for API calls. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

## Install

```bash
npm install slash-tokens
```

## Auto mode

One import. Every LLM call pre-flighted.

```js
import 'slash-tokens/auto'
```

Intercepts `fetch()` to Anthropic, OpenAI, xAI, and Google endpoints. Estimates tokens on the request body before the call leaves your machine. Sub-millisecond. Non-blocking.

```
[slash] Anthropic claude-sonnet | 47,000 tokens | $0.1410 | OK
[slash] xAI grok-4.20 | 12,300 tokens | $0.0246 | OK
```

## Pre-flight check

```ts
import { preflight } from 'slash-tokens'

interface PreflightResult {
  tokens: number
  cost: number           // USD (input tokens * model rate)
  fits: boolean          // under context window
  model: string
  context: number        // model's context window size
  utilization: number    // 0-1
  options: Alternative[] // cheaper models, sorted by cost
}

interface Alternative {
  model: string
  cost: number
  savings: number
  savingsPercent: number
}
```

```js
const check = preflight('Your prompt here...', 'claude-opus')

check.tokens       // 47000
check.cost         // 0.235 (USD)
check.fits         // true
check.options[0]   // { model: 'grok-4-1-fast', cost: 0.0094, savings: 0.2256, savingsPercent: 96 }
```

```js
if (!check.fits) {
  // over context window — trim or reject
}

if (check.options.length > 0) {
  // cheaper model available
  const best = check.options[0]
  // use best.model instead, save best.savingsPercent%
}
```

## Models

10 models with public pricing (as of April 2026).

| Model | $/M input | $/M output | Context |
|---|---|---|---|
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

## Token estimation

The engine underneath. 4.8 KB Zig-compiled WASM. 96-98% accurate.

```js
import { slash, slashBytes } from 'slash-tokens'

slash('Hello world')           // 2
slash(longDocument)            // 47283
slashBytes(new Uint8Array(buf)) // skip TextEncoder
```

Overestimates by design. The margin prevents overflow. The API returns exact counts after the call — pre-call, you only need go/no-go.

## Savings reporting

```js
import { init, report } from 'slash-tokens'

init({ key: 'mcp_slash_xxx' })
// Or: process.env.SLASH_KEY

const result = await report({
  tokens_estimated: 47000,
  tokens_saved: 47000,
  model: 'claude-opus',
  action: 'skipped',        // 'skipped' | 'reduced' | 'routed'
  cost_saved_usd: 0.235
})

result.transaction_id        // 'txn_abc123'
result.fee_usd               // 0.0235 (10% of savings)
result.balance_remaining_usd // 4.9765
```

Key resolution: per-call `key` param > `init({ key })` > `SLASH_KEY` env var.

Register: `POST https://mcpaas.live/api/slash/register` with `{ "email": "you@company.com" }`

## Get started

```bash
export SLASH_KEY=mcp_slash_xxx
bunx slash-tokens
```

Add to your app:

```js
import 'slash-tokens/auto'
```

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

MIT
