// Core estimation
export { slash, slashBytes } from './slash.js';

// Pre-flight checks
export { preflight, preflightRoute } from './preflight.js';
export type { PreflightResult, Alternative } from './preflight.js';

// Quote → Decide (1.7.0): price a job, then choose under a budget + quality floor
export { quote, decide, DEFAULT_MAX_OUTPUT_TOKENS } from './quote.js';
export type { Task, Message, Quote, Policy, Decision, Action } from './quote.js';

// Prove (1.7.0): estimate vs actual, saved vs baseline, the agent's fee
export { reconcile, normalizeUsage } from './receipt.js';
export type { Usage, Receipt, ReconcileOptions } from './receipt.js';

// The agent you hire: quote → decide → book → run → reconcile → receipt
export { hire } from './agent.js';
export type { HireOptions, Job, CallModel, RunResult, Agent } from './agent.js';

// The catalog: prices, provider, capability tier, date checked
export { CATALOG, TIER_NAMES } from './catalog.js';
export type { CatalogEntry, Tier } from './catalog.js';

// Provider groups (shared between preflight + intercept — single source of truth)
export { PROVIDER_MODELS, providerOf } from './providers.js';

// Model intelligence
export { MODELS, listModels } from './models.js';
export type { ModelInfo } from './models.js';

// Transaction reporting
export { report } from './transact.js';
export type { ReportOptions, ReportResult } from './transact.js';

// Configuration
export { init, hasKey } from './config.js';
export { resolveKey } from './config.js';
