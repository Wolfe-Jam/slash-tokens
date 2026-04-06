# /slash-tokens

Pre-flight checks for API calls. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

Fly First. Pay Economy.

## The problem

Every AI API call costs tokens. Most apps have no idea how much a call will cost until after it's made. You're paying for flights you shouldn't board.

## The solution

One line. Before any LLM call. Know the cost. Decide what to do.

```js
import { slash } from 'slash-tokens'

const tokens = slash(prompt)         // 47,000 tokens → $0.71

if (tokens > budget) skip()          // Don't board
if (tokens > threshold) trim(prompt) // Fly lighter
if (tokens > cheap_limit) reroute()  // Cheaper flight
```

## Install

```bash
npm install slash-tokens
```

## API

### `slash(content: string): number`

Estimate token count. Returns immediately. Sub-millisecond.

```js
slash('')                    // 0
slash('hello')               // 1
slash(longDocument)          // 47,283
```

### `slashBytes(bytes: Uint8Array): number`

Estimate from raw bytes. Skips TextEncoder overhead.

### `init(opts: { key: string, endpoint?: string }): void`

Configure your API key for savings reporting.

```js
import { init } from 'slash-tokens'

init({ key: 'mcp_slash_xxx' })
// Or set SLASH_KEY environment variable
```

### `report(opts: ReportOptions): Promise<ReportResult>`

Report savings to the metered API. You pay 10% of what you save.

```js
import { slash, report } from 'slash-tokens'

const tokens = slash(prompt)
if (tokens > threshold) {
  // Skipped the call — report the savings
  await report({
    tokens_estimated: tokens,
    tokens_saved: tokens,
    model: 'claude-sonnet-4-20250514',
    action: 'skipped',         // skipped | reduced | routed
    cost_saved_usd: 0.05
  })
}
```

Key resolution: per-call `key` > `init({ key })` > `SLASH_KEY` env var.

## Evaluate your project

```bash
bunx slash-tokens
```

Finds AI API call sites in your codebase and estimates token waste.

```bash
bunx slash-tokens --key=mcp_slash_xxx
```

With a key, results are reported to the metered API.

## What this is not

This is not a tokenizer. It doesn't decode BPE. It doesn't reproduce exact token counts.

This is a **pre-flight check**. It answers "should this call board?" with 96-98% accuracy in sub-millisecond time. The margin is intentional — overestimate, never underestimate.

## Why not tiktoken?

| | js-tiktoken | gpt-tokenizer | slash-tokens |
|---|---|---|---|
| Size | ~1 MB | 300 KB+ | **4.8 KB** |
| Cold start | Heavy | Moderate | **Sub-ms** |
| Edge-ready | Painful | Difficult | **Native** |
| Models | GPT only | GPT only | **Any model** |
| Dependencies | npm tree | npm tree | **Zero** |

tiktoken counts tokens for OpenAI models. Slash pre-flights any model — Claude, Grok, Gemini, GPT — in 4.8 KB.

## Runtime support

Works everywhere WASM runs: Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, Browser.

## Engine

4.8 KB Zig-compiled WASM. 172 tests including 65 adversarial. Base64-embedded — no separate file to load.

## Links

- [slashtokens.com](https://slashtokens.com)
- [npm](https://www.npmjs.com/package/slash-tokens)
- [mcpaas.live/slash](https://mcpaas.live/slash)

## License

MIT
