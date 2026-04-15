/**
 * WJTTC Cross-Repo Integration Test Suite
 * ========================================
 * Tests the RELATIONSHIP between slash-tokens (npm client) and mcpaas-cf (backend).
 * Proves the two systems speak the same protocol — catches contract drift.
 *
 * Born from: 2026-04-15, dashboard wasn't updating because pass-through
 * calls were silently dropped from transaction records. No test caught it
 * because each repo tested in isolation.
 *
 * Run: bun test tests/z-integration.test.ts
 * Self-contained: auto-registers a trial key, no secrets needed, < $0.01/run.
 *
 * Covers:
 *   TIER 0 (GRID)    — Registration: get on the grid before racing
 *   TIER 1 (BRAKE)   — Contract: SDK sends what API expects
 *   TIER 2 (ENGINE)  — Live feed + usage endpoint shapes
 *   TIER 3 (AERO)    — Pass-through logging (the bug that started this)
 *   TIER 4 (PIT STOP) — Dashboard data consistency
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { slash, init, report } from '../src/index';

const BASE_URL = 'https://mcpaas.live';
const TEST_EMAIL = `slash-test-${Date.now()}@test.slashtokens.com`;

// Populated by TIER 0 registration
let SLASH_KEY = '';

// Auth headers for direct API calls
function authHeaders() {
  return { 'Authorization': `Bearer ${SLASH_KEY}` };
}

// Fetch usage stats
async function getUsage(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/slash/usage`, { headers: authHeaders() });
  return res.json();
}

// Warm up WASM
beforeAll(() => { slash('warmup'); });

// ============================================================================
// TIER 0: GRID — Registration
// "Get on the grid before you can race"
// ============================================================================

describe('TIER 0: GRID — Registration', () => {

  it('registers a fresh trial key', async () => {
    const res = await fetch(`${BASE_URL}/api/slash/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    expect(res.status).toBeLessThanOrEqual(201); // 201 new or 200 existing
    const data = await res.json() as any;
    expect(data.key).toMatch(/^mcp_slash_/);
    expect(data.balance_usd).toBeGreaterThanOrEqual(5);

    SLASH_KEY = data.key;
  });
});

// ============================================================================
// TIER 1: BRAKE — Contract Tests
// "The SDK sends what the API expects"
// ============================================================================

describe('TIER 1: BRAKE — SDK ↔ API Contract', () => {

  it('report() returns valid transaction response', async () => {
    init({ key: SLASH_KEY });
    const result = await report({
      tokens_estimated: 1000,
      tokens_saved: 1000,
      model: 'claude-sonnet',
      action: 'routed',
      cost_saved_usd: 0.003,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
    expect(typeof result.fee_usd).toBe('number');
    expect(typeof result.balance_remaining_usd).toBe('number');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('fee = 10% of savings (contract invariant)', async () => {
    init({ key: SLASH_KEY });
    const result = await report({
      tokens_estimated: 5000,
      tokens_saved: 5000,
      model: 'claude-opus',
      action: 'routed',
      cost_saved_usd: 0.30,
    });

    expect(result.fee_usd).toBe(0.03);
  });

  it('accepts action=prevented', async () => {
    init({ key: SLASH_KEY });
    const result = await report({
      tokens_estimated: 2000,
      tokens_saved: 2000,
      model: 'claude-opus',
      action: 'prevented',
      cost_saved_usd: 0.01,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
  });

  it('accepts action=routed', async () => {
    init({ key: SLASH_KEY });
    const result = await report({
      tokens_estimated: 2000,
      tokens_saved: 2000,
      model: 'grok-4.20',
      action: 'routed',
      cost_saved_usd: 0.004,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
  });

  it('usage txn_count increments after report()', async () => {
    const before = await getUsage();
    const beforeCount = before.transactions_count;

    init({ key: SLASH_KEY });
    await report({
      tokens_estimated: 500,
      tokens_saved: 500,
      model: 'claude-haiku',
      action: 'routed',
      cost_saved_usd: 0.001,
    });

    // KV is eventually consistent — small delay
    await new Promise(r => setTimeout(r, 500));
    const after = await getUsage();

    expect(after.transactions_count).toBeGreaterThan(beforeCount);
  });
});

// ============================================================================
// TIER 2: ENGINE — Endpoint Response Shapes
// "The API returns what the dashboard expects"
// ============================================================================

describe('TIER 2: ENGINE — API Response Shapes', () => {

  it('/api/slash/usage returns complete shape', async () => {
    const data = await getUsage();

    expect(data).toHaveProperty('owner');
    expect(data).toHaveProperty('tier');
    expect(data).toHaveProperty('active');
    expect(data).toHaveProperty('balance_usd');
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('transactions_count');
    expect(data).toHaveProperty('total_saved_usd');
    expect(data).toHaveProperty('total_fees_usd');

    expect(typeof data.balance_usd).toBe('number');
    expect(typeof data.transactions_count).toBe('number');
    expect(data.period).toMatch(/^\d{4}-\d{2}$/);
  });

  it('/slash/v1/live returns array of events with expected shape', async () => {
    const res = await fetch(`${BASE_URL}/slash/v1/live`, { headers: authHeaders() });
    expect(res.status).toBe(200);

    const events = await res.json() as any[];
    expect(Array.isArray(events)).toBe(true);
    // Fresh key — live feed may be empty, that's fine
  });

  it('/slash/v1/history returns array of transactions', async () => {
    const res = await fetch(`${BASE_URL}/slash/v1/history`, { headers: authHeaders() });
    expect(res.status).toBe(200);

    const txns = await res.json() as any[];
    expect(Array.isArray(txns)).toBe(true);

    if (txns.length > 0) {
      const t = txns[0];
      expect(t).toHaveProperty('tokens_estimated');
      expect(t).toHaveProperty('model');
      expect(t).toHaveProperty('action');
      expect(t).toHaveProperty('cost_saved_usd');
      expect(t).toHaveProperty('fee_usd');
      expect(t).toHaveProperty('ts');
      expect(['prevented', 'routed', 'pass']).toContain(t.action);
    }
  });
});

// ============================================================================
// TIER 3: AERO — Pass-Through Logging
// "The bug that started this test suite (2026-04-15)"
// ============================================================================

describe('TIER 3: AERO — Pass-Through Logging', () => {

  it('$0 savings report accepted (not rejected)', async () => {
    init({ key: SLASH_KEY });
    const result = await report({
      tokens_estimated: 10000,
      tokens_saved: 0,
      model: 'claude-opus',
      action: 'routed',
      cost_saved_usd: 0,
    });

    expect(result.transaction_id).toMatch(/^txn_/);
    expect(result.fee_usd).toBe(0);
  });

  it('$0 savings still increments txn_count', async () => {
    const before = await getUsage();
    const beforeCount = before.transactions_count;

    init({ key: SLASH_KEY });
    await report({
      tokens_estimated: 5000,
      tokens_saved: 0,
      model: 'claude-sonnet',
      action: 'routed',
      cost_saved_usd: 0,
    });

    await new Promise(r => setTimeout(r, 500));
    const after = await getUsage();

    expect(after.transactions_count).toBeGreaterThan(beforeCount);
  });

  it('$0 savings does not deduct from balance', async () => {
    const before = await getUsage();

    init({ key: SLASH_KEY });
    await report({
      tokens_estimated: 50000,
      tokens_saved: 0,
      model: 'claude-opus',
      action: 'routed',
      cost_saved_usd: 0,
    });

    await new Promise(r => setTimeout(r, 500));
    const after = await getUsage();

    expect(after.balance_usd).toBe(before.balance_usd);
  });
});

// ============================================================================
// TIER 4: PIT STOP — Dashboard Data Consistency
// "What the API returns matches what the dashboard shows"
// ============================================================================

describe('TIER 4: PIT STOP — Dashboard Data Consistency', () => {

  it('balance after transact matches usage endpoint', async () => {
    init({ key: SLASH_KEY });
    const txnResult = await report({
      tokens_estimated: 1000,
      tokens_saved: 1000,
      model: 'claude-haiku',
      action: 'routed',
      cost_saved_usd: 0.001,
    });

    await new Promise(r => setTimeout(r, 500));
    const usage = await getUsage();

    // Balance from transact response should match usage endpoint
    // (within rounding — KV eventual consistency allows tiny drift)
    expect(Math.abs(usage.balance_usd - txnResult.balance_remaining_usd)).toBeLessThan(0.01);
  });

  it('history reflects transactions from this run', { timeout: 15000 }, async () => {
    // By this point we've made ~10 transactions via report().
    // KV list propagation can lag — retry until history shows up.
    let txns: any[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      const res = await fetch(`${BASE_URL}/slash/v1/history`, { headers: authHeaders() });
      txns = await res.json() as any[];
      if (txns.length > 0) break;
    }

    expect(txns.length).toBeGreaterThan(0);
    // Verify shape of first transaction
    const t = txns[0];
    expect(t).toHaveProperty('tokens_estimated');
    expect(t).toHaveProperty('model');
    expect(t).toHaveProperty('action');
    expect(t).toHaveProperty('ts');
  });
});
