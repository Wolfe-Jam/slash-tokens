# Changelog

## 1.2.1 (2026-04-15)

### Fixes
- Add `pass` action type to `ReportOptions` — SDK types now match server (`prevented | routed | pass`)

### Testing
- Cross-repo integration suite: 17 tests verifying SDK ↔ mcpaas-cf contract
- Self-registering test keys, no secrets needed
- TIER 5 proxy-path tests (Anthropic gateway, OpenAI, txn counting)
- 118 tests total, 374 assertions

---

## 1.2.0 (2026-04-14)

### The Next.js Edition

Session summary on exit — every time you stop your dev server, Slash prints how much you saved that session:
```
[slash] Session: 47 calls | 23 routed | $0.89 salvaged — The more you build, the more you save
```
Fires on `exit`, `SIGINT` (Ctrl+C), and `SIGTERM`. Zero calls = silent.

### New
- `auto` mode: session summary on process exit
- Dashboard: 90-day transaction history (History panel, show all)
- Dashboard: live feed now scrollable, shows `$saved` instead of raw token counts

### Testing
- 99 pass, 0 fail, 326 assertions

---

## 1.1.2 (2026-04-13)

### Fixes
- Fix Haiku model ID — `claude-haiku-4-5-20251001` (was wrong, routing would fail)
- Action types aligned to Gate vocabulary — `prevented | routed` (was `skipped | reduced | routed`)

### Testing
- 99 pass, 0 fail, 326 assertions

## 1.1.1 (2026-04-08)

Token Optimization for Context Engineers.

### Auto Mode — Routes to Cheapest Model
- `import 'slash-tokens/auto'` — one import, every call optimized
- Routes within same provider: Opus → Haiku, GPT-5.4 → Nano, Grok → Fast
- Rewrites request body before fetch — the API gets the cheaper model
- Verbose by default — new users see every call, every route, every save
- Nudges at $5/$10/$25/$50/$100 thresholds: `⚡ $5 salvaged — keep building`

### Configuration
- `init({ route: true })` — route to cheapest model (default)
- `init({ route: false })` — track only, don't touch my models
- `init({ models: ['claude-haiku', 'claude-sonnet'] })` — model-level control
- `init({ quiet: true })` — nudges only, no per-call logging

### CLI
- Evaluator doesn't charge — `bunx slash-tokens` is free
- "Token optimization analysis" (not "burn analysis")
- "TOKENS SALVAGED" (not "savings")
- "DAILY TOKEN VOLUME" (not "daily burn")
- Single "Next" link to setup page

### API
- `salvaged` / `salvagePercent` (replaces `savings` / `savingsPercent`)
- npm description: "Token Optimization for Context Engineers"

### Testing
- 99 pass, 0 fail, 326 assertions

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
