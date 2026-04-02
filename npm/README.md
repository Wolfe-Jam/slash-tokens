# /slash-tokens

Token budget estimation in 4.8 KB WASM. Sub-millisecond. Zero dependencies.

I don't count tokens. I slash them.

## Install

```bash
npm install slash-tokens
```

## Use

```js
import { slash } from 'slash-tokens'

const tokens = slash('Your content here')

if (tokens > 128_000) trim(content)     // Context window gate
const cost = tokens * PRICE_PER_TOKEN   // Cost estimation
```

One function. Returns a number. That's the entire API.

## Scan your project

```bash
bunx slash-tokens
```

Finds every AI API call in your codebase and estimates your token burn:

```
  ⚡ /slash
  Token burn analysis

  Scanned 47 files in 3ms

  CALL SITES
  ────────────────────────────────────────────────────────
  src/api/chat.ts:24       Anthropic    ~2,400 tok/call
  src/api/summary.ts:11    OpenAI       ~8,200 tok/call
  src/lib/agent.ts:88      Vercel AI    ~1,100 tok/call

  DAILY BURN (100 calls/site/day)
  ────────────────────────────────────────────────────────
  Input tokens:    1,520,000
  Output tokens:   3,040,000  (estimated)
  Total:           4,560,000 tokens/day

  MONTHLY COST ($3/$15 per MTok)
  ────────────────────────────────────────────────────────
  Total:           $1,504.80/mo

  ⚡ SLASH SAVINGS (10% gate efficiency)
  ────────────────────────────────────────────────────────
  Annual savings:  $1,805.76/yr
```

Detects: OpenAI, Anthropic, Vercel AI, LangChain, Gemini, Bedrock, Grok, Cohere, Mistral.

## How it works

Single-pass byte classification over your content. No vocabulary tables. No BPE decode. Classifies content type (prose, code, JSON, YAML, mixed), applies a calibrated chars-per-token ratio, adds a safety margin.

Budget gate — better to say "doesn't fit" than overflow. The API returns exact counts after the call. Pre-call, you only need go/no-go.

## Numbers

| | js-tiktoken | gpt-tokenizer | slash-tokens |
|---|---|---|---|
| Size | ~1 MB | 300 KB+ | **4.8 KB** |
| Cold start | Heavy | Moderate | **Sub-ms** |
| Edge-ready | Painful | Difficult | **Native** |
| Models | GPT only | GPT only | **Any model** |
| Dependencies | npm tree | npm tree | **Zero** |
| Allocations | Many | Many | **Zero** |

## Runtime support

Works everywhere WASM runs:

- Node.js
- Bun
- Deno
- Cloudflare Workers
- Vercel Edge
- Browser

## API

### `slash(content: string): number`

Estimate token count for a string. Returns `u32`.

```js
slash('')                    // 0
slash('hello')               // 1
slash(longDocument)          // 4,283
```

### `slashBytes(bytes: Uint8Array): number`

Estimate token count from raw bytes. Skips `TextEncoder` overhead.

## What this is not

This is not a tokenizer. It doesn't decode BPE. It doesn't reproduce exact token counts. No tokenizer can — Claude, Grok, and Gemini vocabularies are not public.

This is a **budget gate**. It answers "does this fit?" with 96-98% accuracy in sub-millisecond time. The 2-4% margin is intentional — overestimate, never underestimate.

## Engine

4,865 bytes of Zig-compiled WASM (`wasm32-freestanding`). No allocator. No floats. No heap. Base64-embedded — no separate `.wasm` file to load.

Built from [xai-faf-zig](https://github.com/Wolfe-Jam/xai-faf-zig). 172 tests including 65 adversarial (CJK, emoji, binary, base64, threshold boundaries).

## License

MIT
