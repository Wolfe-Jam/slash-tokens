# TEST-NOTES — slash-tokens

> Which test holds each invariant, and what isn't tested yet. Inline `// TEST-NOTE:` comments in `src/` point back here. `bun test` runs the suite; every test file also passes on its own (`bun test tests/<file>`).

---

## Routing invariants

| Invariant | Held by |
|---|---|
| `preflightRoute()` is same-provider only, for every model | `preflight.test.ts` › *preflightRoute never returns a cross-provider model* |
| `preflight().options` is cross-provider analysis; `options[0]` is not a routing decision | `preflight.test.ts` › *preflight() semantics unchanged — still cross-provider analysis* |
| `preflightRoute()` returns `null` for an unknown model, or when nothing cheaper exists | `preflight.test.ts` › *returns null for unknown model* / *no cheaper same-provider option* |
| `preflightRoute()` never picks a model the prompt doesn't fit | `preflight.test.ts` › *preflightRoute never picks a model the prompt does not fit* |
| `preflightRoute()` is always cheaper, and its cost matches an independent calculation | `preflight.test.ts` › *always cheaper than input model* / *cost matches an independently-computed ground truth* |
| `preflightRoute()` honours `init({ route: false })` and `init({ models })` | `preflight.test.ts` › *respects init({route: false})* / *respects init({models: [...]})* |
| Every priced model has a provider (`providerOf`) | `preflight.test.ts` › *providerOf returns correct provider for every model in MODELS* |
| `intercept.ts` uses the shared `PROVIDER_MODELS`, not its own copy | `preflight.test.ts` › *intercept.ts uses the shared PROVIDER_MODELS* |
| grok-build-0.1 is priced but never a routing target | `preflight.test.ts`, `auto-safety.test.ts` |

**Changed since v1.4.0:** `preflightRoute()` and `/auto` no longer agree on purpose. `/auto` (`intercept.ts` `findCheapestRoute`) and the hosted proxy rewrite live calls only to their frozen 1.6.5 targets (`AUTO_ROUTE_TARGETS`); `preflightRoute()` and `decide()` consider every priced model. `auto-safety.test.ts` pins `/auto` to the 1.6.5 targets.

## Accuracy invariants

| Invariant | Held by |
|---|---|
| Calibrated counts are never under the real count (29-sample corpus; Claude, Gemini, Grok, Nemotron from recorded bench results, GPT-5.x via o200k_base) | `accuracy-gate.test.ts` |
| A quote is never under a recorded real Nebius bill (`underReported` stays false) | `request-framing.test.ts` |
| A > 1 MB input doesn't skew later counts | `wasm-memory.test.ts` |
| Grok's long-context rate applies above 200K tokens; models without a tier stay flat | `long-context-pricing.test.ts` |
| Every catalog price was checked within 30 days | `freshness.test.ts` (fixed dates) · `npm run check:freshness` (weekly, `freshness.yml`) |

## Product paths

| Path | Held by |
|---|---|
| `quote()` / `decide()` and catalog coherence | `quote-decide.test.ts` |
| `reconcile()` receipts, `hire().run()` budgets, `slash-tokens quote` CLI | `receipt-agent.test.ts` |
| `/auto` interception, routing targets, `report()` payload (numbers only) | `auto-safety.test.ts`, `preflight.test.ts` (TIER 4–5), `intercept-normalize.test.ts` |
| The scan: per-provider calibration and pricing | `scanner.test.ts` |
| `--version` / `--help` | `cli-flags.test.ts` |
| Live mcpaas.live integration (only with `SLASH_LIVE=1`; weekly `integration.yml`) | `z-integration.test.ts` |

---

## Not tested yet

- **GPT-6 calibration.** GPT-6 takes the conservative default factor (2.05) until a bench run adds it; the accuracy gate covers GPT-5.x only.
- **Request framing outside Nebius.** xAI comes from the Grok bench, OpenAI from its tiktoken cookbook, and Anthropic and Google are allowances. None is checked against a real bill.
- **Gemini 3.1 Pro's long-context rate** ($4 / $18 above 200K). It's in the catalog, but only Grok's tier has a test.
- **Model-count floor.** `preflight.test.ts` asserts `>= 10` models; the catalog has 48. A tighter floor would catch an accidental removal.
- **Price order within a provider** (e.g. a flagship never priced below its small model). Not a hard rule, but it would catch a typo in the catalog.
