// Core estimation
export { slash, slashBytes } from './slash.js';

// Pre-flight checks
export { preflight, preflightRoute } from './preflight.js';
export type { PreflightResult, Alternative } from './preflight.js';

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
