import { slash } from './slash.js';
import { getModel, MODELS } from './models.js';

export interface Alternative {
  model: string;
  cost: number;
  savings: number;
  savingsPercent: number;
}

export interface PreflightResult {
  tokens: number;
  cost: number;
  fits: boolean;
  model: string;
  context: number;
  utilization: number;
  options: Alternative[];
}

export function preflight(content: string, model: string): PreflightResult {
  const tokens = slash(content);
  const info = getModel(model);

  if (!info) {
    throw new Error(
      `Unknown model: "${model}". Available: ${Object.keys(MODELS).join(', ')}`
    );
  }

  const cost = Math.round(((tokens / 1_000_000) * info.input) * 1_000_000) / 1_000_000;
  const fits = tokens <= info.context;
  const utilization = Math.round((tokens / info.context) * 10000) / 10000;

  const options: Alternative[] = Object.entries(MODELS)
    .filter(([m]) => m !== model)
    .filter(([_, v]) => v.context >= tokens)
    .map(([m, v]) => {
      const altCost = Math.round(((tokens / 1_000_000) * v.input) * 1_000_000) / 1_000_000;
      return {
        model: m,
        cost: altCost,
        savings: Math.round((cost - altCost) * 1_000_000) / 1_000_000,
        savingsPercent: cost > 0 ? Math.round(((cost - altCost) / cost) * 10000) / 100 : 0,
      };
    })
    .filter(o => o.savings > 0)
    .sort((a, b) => a.cost - b.cost);

  return { tokens, cost, fits, model, context: info.context, utilization, options };
}
