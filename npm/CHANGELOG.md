# Changelog

## 1.1.0 (2026-04-07)

Token Optimization for Context Engineering.

### Features
- `preflight(content, model)` — tokens, cost, fits, cheaper alternatives
- `import 'slash-tokens/auto'` — one import, every LLM call pre-flighted
- 10 models with verified April 2026 pricing (Claude, Grok, Gemini, GPT)
- `report()` — metered savings reporting, 10% of what you save
- `init()` — key configuration with 3-layer resolution
- `MODELS` — full pricing table exported for direct access
- `listModels()` — enumerate all supported models

### Models (April 2026)
- Anthropic: claude-opus ($5/M), claude-sonnet ($3/M), claude-haiku ($1/M)
- xAI: grok-4.20 ($2/M), grok-4-1-fast ($0.20/M)
- Google: gemini-3.1-pro ($2/M), gemini-2.5-flash ($0.30/M)
- OpenAI: gpt-5.4 ($2.50/M), gpt-5.4-mini ($0.75/M), gpt-5.4-nano ($0.20/M)

### Auto mode
- Intercepts fetch() to Anthropic, OpenAI, xAI, Google endpoints
- Model name normalization (handles full API IDs + legacy names)
- Non-blocking, sub-millisecond

### Testing
- 323 tests: 172 Zig, 101 TypeScript, 50 API

## 1.0.0 (2026-04-07)

Initial v1 release. Superseded by 1.1.0 (pricing corrections).

## 0.3.0 (2026-04-06)

Deprecated. Added preflight + auto mode with outdated pricing.

## 0.2.0 (2026-04-06)

Deprecated. Added report() + init() SDK integration.

## 0.1.0 (2026-04-04)

Deprecated. Token estimation + CLI scanner.

## 0.0.1 (2026-04-02)

Initial placeholder.
