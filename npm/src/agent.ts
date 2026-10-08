import { decide, type Task, type Decision, type Policy, type Message } from './quote.js';
import { reconcile, type Receipt, type Usage } from './receipt.js';
import type { Tier } from './catalog.js';

export interface HireOptions {
  /** Total USD the agent may spend across every job it runs. No budget = no limit. */
  budget?: number;
  /** Model the savings are measured against. Default: the model each job asks for. */
  baseline?: string;
  /** Lowest tier a substitute may have. Default: each job's requested tier. */
  floor?: Tier;
  /** The agent's cut of measured savings. Default 0.10. */
  feeRate?: number;
  /** Fee shown on the receipt but not charged. Default true. */
  waived?: boolean;
}

/**
 * What the agent calls to do the work: your provider client. `model` is the
 * booked catalog key (e.g. `nemotron-3.5-lightning`); map it to your
 * provider's API ID. Return the output and the provider's `usage` object.
 */
export type CallModel = (model: string, input: string | Message[]) => Promise<{ output: string; usage: Usage }>;

export interface Job extends Task {
  call: CallModel;
}

export interface RunResult {
  decision: Decision;
  /** The model's output; undefined when blocked. */
  output?: string;
  /** Estimate vs actual, saved vs baseline, fee; undefined when blocked. */
  receipt?: Receipt;
}

export interface Agent {
  /** Quote → decide → book → run → reconcile → receipt. */
  run(job: Job): Promise<RunResult>;
  /** USD spent so far (actual cost, from receipts). */
  readonly spent: number;
  /** USD left in the budget (Infinity with no budget). */
  readonly remaining: number;
  readonly receipts: readonly Receipt[];
}

/**
 * Hire Slash for a run of jobs. Each job is quoted, booked on the cheapest
 * model the policy allows (or blocked), run through your `call`, and
 * reconciled against the provider's own usage. The budget covers all jobs:
 * each one may spend only what earlier jobs left.
 */
export function hire(opts: HireOptions = {}): Agent {
  const receipts: Receipt[] = [];
  let spent = 0;
  const budget = opts.budget ?? Infinity;

  return {
    get spent() { return spent; },
    get remaining() { return Math.max(budget - spent, 0); },
    get receipts() { return receipts; },

    async run(job: Job): Promise<RunResult> {
      const { call, ...task } = job;
      const policy: Policy = { floor: opts.floor };
      if (budget !== Infinity) policy.budget = Math.max(budget - spent, 0);

      const decision = decide(task, policy);
      if (decision.action === 'block' || !decision.chosen) return { decision };

      const { output, usage } = await call(decision.chosen.model, task.input);
      const receipt = reconcile(decision.chosen, usage, {
        baseline: opts.baseline ?? decision.requested.model,
        feeRate: opts.feeRate,
        waived: opts.waived,
      });
      spent = Math.round((spent + receipt.actual.cost) * 1_000_000) / 1_000_000;
      receipts.push(receipt);
      return { decision, output, receipt };
    },
  };
}
