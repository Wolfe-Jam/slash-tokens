#!/usr/bin/env bun
// check-freshness.ts — the catalog's prices must be recent, and an announced
// price change must be handled before it lands.
//
// Fails (exit 1) when any model's `asOf` is older than MAX_AGE_DAYS, or its
// `priceUntil` is within WARN_DAYS. Runs weekly (.github/workflows/freshness.yml)
// and on demand: `bun scripts/check-freshness.ts`.

import { CATALOG, type CatalogEntry } from '../src/catalog';

export const MAX_AGE_DAYS = 30;
export const WARN_DAYS = 14;

const DAY = 86_400_000;
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export function freshnessProblems(catalog: Record<string, CatalogEntry>, today: string): string[] {
  const now = day(today);
  const problems: string[] = [];
  for (const [model, e] of Object.entries(catalog)) {
    const age = Math.floor((now - day(e.asOf)) / DAY);
    if (age > MAX_AGE_DAYS) problems.push(`${model}: price checked ${e.asOf}, ${age} days ago (limit ${MAX_AGE_DAYS})`);
    if (e.priceUntil) {
      const left = Math.floor((day(e.priceUntil) - now) / DAY);
      if (left < WARN_DAYS) problems.push(`${model}: price holds until ${e.priceUntil} (${left < 0 ? 'passed' : `${left} days left`})`);
    }
  }
  return problems;
}

if (import.meta.main) {
  const today = new Date().toISOString().slice(0, 10);
  const problems = freshnessProblems(CATALOG, today);
  if (problems.length) {
    console.error(`✗ catalog prices need a check (${problems.length}):`);
    for (const p of problems) console.error(`  ${p}`);
    console.error('Re-check the provider pricing pages, update src/catalog.ts and asOf.');
    process.exit(1);
  }
  console.log(`✓ catalog fresh on ${today}: ${Object.keys(CATALOG).length} models, all checked within ${MAX_AGE_DAYS} days`);
}
