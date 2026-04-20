# TEST-NOTES — slash-tokens v1.4.0 (pending)

> Running collection of what should be tested. Inline `// TEST-NOTE:` comments in source point back here. Feeds into #5 WJTTC catch-all suite.

---

## Context

v1.3.0 shipped with a silent semantic bug: `preflight().options[0]` returned the globally cheapest model, but consumers (e.g., slash-nextjs) used it as if it were a routing decision. The actual routing (in `intercept.ts` `findCheapestRoute` and in mcpaas-cf proxy) is **same-provider only**. The two algorithms disagreed.

v1.4.0 fix: extract `PROVIDER_MODELS` + `providerOf` to `providers.ts` (shared), add `preflightRoute()` to `preflight.ts` which uses the same-provider logic. `preflight()` unchanged (still cross-provider, still analysis-mode).

---

## What to test

### 1. Critical: preflightRoute is same-provider only

For every canonical model in `PROVIDER_MODELS`, `preflightRoute('any prompt', model)` must return either:
- `null` (no cheaper same-provider option), OR
- an `Alternative` whose `model` appears in the same `PROVIDER_MODELS[provider]` as the input

**Never cross-provider.**

```ts
for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
  for (const model of models) {
    const route = preflightRoute('test prompt', model);
    if (route) {
      expect(PROVIDER_MODELS[provider]).toContain(route.model);
    }
  }
}
```

### 2. Critical: preflight and preflightRoute answer DIFFERENT questions

`preflight().options` is cross-provider analysis (may include Grok when input is Opus).
`preflightRoute()` is same-provider routing (never Grok when input is Opus).

Assert the difference exists:

```ts
// For at least one model (e.g. claude-opus), preflight.options[0] may be
// cross-provider (cheapest globally), while preflightRoute is strictly
// same-provider. They CAN disagree — that's by design.
const pre = preflight('hello', 'claude-opus');
const route = preflightRoute('hello', 'claude-opus');
// Not an assertion that they DISAGREE, but an assertion of their SEMANTICS:
if (route) {
  expect(route.model).toMatch(/^claude/);  // always same-provider
}
// pre.options[0] could be anything cheaper — grok, gemini, etc.
```

### 3. Critical: preflightRoute agrees with intercept.ts findCheapestRoute

For any (provider, tokens, model) triplet, both functions must return the same model. This is the cross-function semantic test that would have caught the v1.3.0 bug.

Currently `findCheapestRoute` in `intercept.ts` is not exported. One of:
- Export it (new public API)
- OR test via behavioral composition (patch fetch, send request, inspect what gets sent upstream vs what preflightRoute predicts)

```ts
// If findCheapestRoute is exported:
for (const model of PROVIDER_MODELS.Anthropic) {
  const tokens = 100;
  const direct = findCheapestRoute('Anthropic', tokens, model);
  const predicted = preflightRoute('x'.repeat(tokens * 4), model)?.model ?? null;
  expect(predicted).toBe(direct);
}
```

### 4. preflightRoute returns null for unknown model

```ts
expect(preflightRoute('hello', 'not-a-real-model')).toBeNull();
```

### 5. preflightRoute returns null when model has no cheaper same-provider option

```ts
// claude-haiku is the cheapest Anthropic model — no cheaper same-provider
expect(preflightRoute('hello', 'claude-haiku')).toBeNull();

// gpt-5.4-nano is cheapest OpenAI — null
expect(preflightRoute('hello', 'gpt-5.4-nano')).toBeNull();
```

### 6. preflightRoute respects context fit

If tokens exceed an alternative's context window, it must not be selected:

```ts
const hugeTokens = 500_000; // exceeds gpt-5.4-mini's 128K context
const content = 'x'.repeat(hugeTokens * 4);
const route = preflightRoute(content, 'gpt-5.4');
if (route) {
  // Must not pick -mini or -nano — they don't fit 500K tokens
  expect(route.model).not.toBe('gpt-5.4-mini');
  expect(route.model).not.toBe('gpt-5.4-nano');
}
```

### 7. providerOf returns correct provider for every canonical model

```ts
expect(providerOf('claude-opus')).toBe('Anthropic');
expect(providerOf('gpt-5.4-nano')).toBe('OpenAI');
expect(providerOf('grok-4-1-fast')).toBe('xAI');
expect(providerOf('gemini-2.5-flash')).toBe('Google');
expect(providerOf('not-real')).toBeNull();

// Every model in MODELS should have a provider
for (const model of Object.keys(MODELS)) {
  expect(providerOf(model)).not.toBeNull(); // would catch a model added to MODELS but missing from PROVIDER_MODELS
}
```

### 8. PROVIDER_MODELS is the single source of truth

```ts
// intercept.ts should not have its own PROVIDER_MODELS anymore.
// If someone re-duplicates it, this test should fail.
const interceptSource = readFileSync('src/intercept.ts', 'utf-8');
expect(interceptSource).not.toMatch(/const PROVIDER_MODELS/);
```

### 9. Existing preflight behavior unchanged

The 100 existing tests must still pass. `preflight()` semantics (cross-provider analysis) are unchanged. Only addition is `preflightRoute()`.

```ts
// Regression: preflight() still returns cross-provider options when applicable
const pre = preflight('simple short prompt', 'claude-opus');
// Grok/Gemini/etc. may appear in options — that's expected
```

---

## For #5 — Comprehensive WJTTC catch-all

This file's tests should be promoted into a proper WJTTC tier suite:

- **TIER 1 (BRAKE)**: Tests 1, 3, 7, 8. If any of these fail, routing is fundamentally broken.
- **TIER 2 (ENGINE)**: Tests 2, 4, 5, 6. Core behaviors and edge cases.
- **TIER 3 (AERO)**: Test 9 (regression). Polish/non-breaking verifications.
- **TIER 4 (PIT STOP — Integration)**: Add integration tests against live mcpaas-cf proxy that the preflightRoute prediction matches the proxy's actual routing decision — cross-repo semantic agreement.

The bug this doc responds to would have been caught at TIER 1 test #1 or #3. The missing test was the root cause of the bug reaching production.

---

## Other tests worth adding (not blocking v1.4.0)

- **Model count floor**: assert `Object.keys(MODELS).length >= N` where N is the current known-good count. Catches accidental removals.
- **Pricing monotonicity**: within each provider, prices should be sanely ordered (opus > sonnet > haiku). Not a hard rule but catches typos in pricing table.
- **`preflight().options` ordering**: sorted ascending by cost. Catches sort regression.
- **`preflight()` salvaged signs**: every option has `salvaged > 0`. Catches negative salvage (which would mean "cheaper route is more expensive" — a bug).

---

*Generated 2026-04-19 during the preflightRoute fix. Update as new test needs surface.*
