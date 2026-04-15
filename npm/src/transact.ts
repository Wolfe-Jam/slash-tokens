import { resolveKey, getEndpoint } from './config.js';

export interface ReportOptions {
  key?: string;
  tokens_estimated: number;
  tokens_saved: number;
  model?: string;
  action: 'prevented' | 'routed' | 'pass';
  cost_saved_usd: number;
}

export interface ReportResult {
  transaction_id: string;
  fee_usd: number;
  balance_remaining_usd: number;
  timestamp: string;
}

export async function report(opts: ReportOptions): Promise<ReportResult> {
  const key = resolveKey(opts.key);
  const endpoint = getEndpoint();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      tokens_estimated: opts.tokens_estimated,
      tokens_saved: opts.tokens_saved,
      model: opts.model || 'unknown',
      action: opts.action,
      cost_saved_usd: opts.cost_saved_usd,
    }),
  });

  if (res.status === 401) throw new Error('Invalid Slash API key');
  if (res.status === 402) throw new Error('Insufficient balance. Purchase credits at slashtokens.com');
  if (res.status === 429) throw new Error('Rate limited. Try again shortly.');
  if (!res.ok) throw new Error(`Slash API error: ${res.status}`);

  return res.json() as Promise<ReportResult>;
}
