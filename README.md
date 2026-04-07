# /slash-tokens

Pre-flight checks for API calls. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

**Fly First. Pay Economy.**

## Install

```bash
npm install slash-tokens
```

## Pre-flight check

Every API call is a flight. Know the cost before you board.

```js
import { preflight } from 'slash-tokens'

const check = preflight(prompt, 'claude-opus')

check.tokens       // 47,000
check.cost         // $0.71
check.fits         // true (under 200K context window)
check.options      // 11 cheaper models
check.options[0]   // { model: 'claude-haiku', cost: $0.01, savingsPercent: 99 }
```

99% savings. Not compression. Not caching. Right-sizing.

## Auto mode

One line. Every LLM call pre-flighted automatically.

```js
import 'slash-tokens/auto'
```

Intercepts `fetch()` to Anthropic, OpenAI, xAI, and Google APIs. Logs every call. Sub-millisecond. Non-blocking. Zero config.

No key: console logging (free forever).
With key: meter runs, savings reported.

## Models

12 models with public pricing. Pre-flight any of them.

| Provider | Models |
|---|---|
| Anthropic | claude-opus, claude-sonnet, claude-haiku |
| xAI | grok-3, grok-3-mini |
| Google | gemini-2.0-flash, gemini-2.0-pro |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano |

```js
import { listModels } from 'slash-tokens'
listModels() // all 12
```

## Token estimation

The engine underneath. Returns a count. Sub-millisecond. Any model.

```js
import { slash } from 'slash-tokens'

slash('Hello world')           // 2
slash(longDocument)            // 47,283
slash(JSON.stringify(payload)) // 1,205
```

96-98% accurate. The margin is intentional — overestimate, never underestimate.

## Savings reporting

You save on a call, we take 10%. If we save you $50, we earn $5.

```js
import { init, report } from 'slash-tokens'

init({ key: 'mcp_slash_xxx' })
// Or set SLASH_KEY environment variable

await report({
  tokens_estimated: 47000,
  tokens_saved: 47000,
  model: 'claude-opus',
  action: 'skipped',        // skipped | reduced | routed
  cost_saved_usd: 0.70
})
// → { transaction_id, fee_usd, balance_remaining_usd }
```

$5 on the house. No flight, no fee. When you save, we earn.

## Get started

```bash
# 1. Set your key
export SLASH_KEY=mcp_slash_xxx

# 2. Try it
bunx slash-tokens

# 3. Add to your app
# import 'slash-tokens/auto'
```

Register for a key at [mcpaas.live/slash/scan](https://mcpaas.live/slash/scan) or via API:

```bash
curl -X POST https://mcpaas.live/api/slash/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@company.com"}'
```

## Why not tiktoken?

| | tiktoken | slash-tokens |
|---|---|---|
| Size | ~1 MB | **4.8 KB** |
| Cold start | Heavy | **Sub-ms** |
| Models | GPT only | **Any model** |
| Edge-ready | Painful | **Native** |
| Dependencies | npm tree | **Zero** |
| Pre-flight | No | **Yes** |
| Cost calc | No | **Yes** |
| Auto mode | No | **Yes** |

tiktoken counts tokens for OpenAI. Slash pre-flights any model in 4.8 KB.

## Runs everywhere

Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, Browser.

4.8 KB Zig-compiled WASM. Base64-embedded. No separate file to load.

## Testing

325 tests across the stack:
- 172 in Zig (65 adversarial: CJK, emoji, binary, base64, threshold boundaries)
- 103 in TypeScript (SDK, preflight, billing, auto mode)
- 50 on the API (transaction lifecycle, auth, injection, key format attacks)

## Dashboard

[mcpaas.live/slash/dashboard](https://mcpaas.live/slash/dashboard) — see your balance, tokens salvaged, credits recovered.

## Links

- [slashtokens.com](https://slashtokens.com) — the pitch
- [mcpaas.live/slash](https://mcpaas.live/slash) — developer page
- [mcpaas.live/slash/scan](https://mcpaas.live/slash/scan) — evaluate a repo
- [npm](https://www.npmjs.com/package/slash-tokens)

## License

MIT
