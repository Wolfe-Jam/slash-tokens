/**
 * Benchmark Corpus — Representative prompt types for tokenizer calibration
 * Each entry: { name, type, content }
 */

export const corpus = [
  // --- Code ---
  {
    name: 'ts-function',
    type: 'code',
    content: `import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', async (c) => {
  const start = performance.now();
  const status = {
    healthy: true,
    latency: Math.round(performance.now() - start),
    version: '1.0.0',
    runtime: 'cloudflare-workers',
  };
  return c.json(status);
});

export default app;`,
  },
  {
    name: 'python-class',
    type: 'code',
    content: `class TokenOptimizer:
    """Estimates token usage before API calls."""

    def __init__(self, model: str = "claude-opus"):
        self.model = model
        self.pricing = {
            "claude-opus": {"input": 5.00, "output": 25.00},
            "claude-sonnet": {"input": 3.00, "output": 15.00},
            "claude-haiku": {"input": 1.00, "output": 5.00},
        }

    def estimate(self, content: str) -> dict:
        tokens = len(content.encode()) // 4  # rough estimate
        price = self.pricing.get(self.model, {"input": 5.0})
        cost = (tokens / 1_000_000) * price["input"]
        return {"tokens": tokens, "cost_usd": cost, "model": self.model}

    def should_route(self, tokens: int) -> str | None:
        if tokens < 1000:
            return "claude-haiku"
        elif tokens < 10000:
            return "claude-sonnet"
        return None`,
  },
  {
    name: 'rust-struct',
    type: 'code',
    content: `use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct FafContext {
    pub faf_version: String,
    pub project: ProjectMeta,
    pub stack: HashMap<String, String>,
    pub human_context: HumanContext,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectMeta {
    pub name: String,
    pub goal: String,
    pub main_language: String,
    #[serde(rename = "type")]
    pub project_type: String,
}

impl FafContext {
    pub fn score(&self) -> u8 {
        let mut filled = 0u8;
        let total = 9u8;
        if !self.project.name.is_empty() { filled += 1; }
        if !self.project.goal.is_empty() { filled += 1; }
        if !self.project.main_language.is_empty() { filled += 1; }
        ((filled as f32 / total as f32) * 100.0) as u8
    }
}`,
  },

  // --- Prose ---
  {
    name: 'technical-docs',
    type: 'prose',
    content: `Token optimization is the practice of measuring and reducing the cost of API calls to large language models. Most applications have no visibility into what a call costs until the invoice arrives. The gap between request and receipt creates a category of waste we call "sunk cost" — money spent on calls that could have been prevented, routed to cheaper models, or reduced in scope.

The Slash approach is to evaluate every call before it leaves your machine. A 4.8 KB WASM module estimates the token count in sub-millisecond time, compares against the model's pricing, and determines whether to send, route, or prevent. The estimator overestimates by design — the margin prevents context overflow. Pre-call, you only need go/no-go accuracy, not exact counts.

This frictionless model means no subscription, no upfront cost. Slash collects 10% of agreed savings from Token-Optimization. For every $10 salvaged, Slash keeps $1. The user never pays — Slash earns. Same formula from a solo developer to SpaceX.`,
  },
  {
    name: 'conversational',
    type: 'prose',
    content: `Hey, I've been using Claude Code for about three weeks now and I'm starting to notice patterns in how it handles large context windows. When the conversation gets past about 200K tokens, responses start to feel less precise — like it's summarizing rather than reasoning. Have you seen this?

Also, quick question: is there a way to see exactly how many tokens each message costs before it's sent? I'm on the Pro plan but I'd like to understand my usage better. My team is considering the Enterprise tier and we need usage data to justify the cost.

One more thing — we're building a RAG system and the embeddings endpoint seems to handle batch requests differently than the messages endpoint. Is there documentation on optimal batch sizes for ada-002 vs the newer embedding models?`,
  },

  // --- JSON ---
  {
    name: 'api-response',
    type: 'json',
    content: JSON.stringify({
      status: "success",
      data: {
        transactions: Array.from({ length: 20 }, (_, i) => ({
          id: `txn_${(1000 + i).toString(16)}`,
          model: i % 3 === 0 ? "claude-opus" : i % 3 === 1 ? "claude-sonnet" : "claude-haiku",
          tokens_estimated: Math.floor(Math.random() * 50000) + 1000,
          cost_saved_usd: Math.round(Math.random() * 100) / 100,
          action: i % 4 === 0 ? "prevented" : i % 4 === 1 ? "routed" : "pass",
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        })),
        summary: { total_saved: 477.27, total_fees: 47.69, transactions_count: 3451 },
      },
    }, null, 2),
  },
  {
    name: 'config-yaml-as-json',
    type: 'json',
    content: JSON.stringify({
      faf_version: "3.0",
      project: { name: "slash-tokens", goal: "Token Optimization for Context Engineers", main_language: "TypeScript", type: "cli" },
      stack: { backend: "slotignored", frontend: "slotignored", runtime: "slotignored" },
      human_context: {
        who: "Context Engineers making LLM API calls",
        what: "Pre-call token checks in 4.8 KB WASM",
        why: "You don't know what a call costs until the invoice arrives",
        where: "npm, slashtokens.com, mcpaas.live/slash",
        when: "v1.2.1, April 2026",
        how: "npm install slash-tokens",
      },
    }, null, 2),
  },

  // --- Markdown ---
  {
    name: 'readme-excerpt',
    type: 'markdown',
    content: `# /slash-tokens

Token Optimization for Context Engineers.
4.8 KB WASM. Sub-millisecond. Zero dependencies.

## Auto mode

One import. Every LLM call checked pre-call.

\`\`\`js
import 'slash-tokens/auto'
\`\`\`

Intercepts \`fetch()\` to Anthropic, OpenAI, xAI, and Google endpoints.

| Model | $/M input | $/M output | Context |
|---|---|---|---|
| claude-opus | 5.00 | 25.00 | 1M |
| claude-sonnet | 3.00 | 15.00 | 1M |
| claude-haiku | 1.00 | 5.00 | 200K |

## Testing

323 tests:
- 172 Zig (65 adversarial)
- 103 TypeScript
- 50 API`,
  },

  // --- Mixed ---
  {
    name: 'mixed-code-prose',
    type: 'mixed',
    content: `The \`logProxyTransaction\` function was silently dropping pass-through calls. Here's the bug:

\`\`\`typescript
if (data.costSaved <= 0) return; // No savings, no transaction
\`\`\`

This line caused the dashboard to appear frozen. The live feed showed activity (written above the return), but transaction records and monthly usage stats were never updated for $0-savings calls.

The fix removes the early return and writes ALL calls:

\`\`\`typescript
const action = data.routedModel === 'PREVENTED' ? 'prevented'
  : data.routed ? 'routed'
  : 'pass';

await kv.put(\`mcp_slash_txn:\${keyId}:\${txnId}\`, JSON.stringify({
  tokens_estimated: data.tokens,
  model: data.originalModel,
  action,
  cost_saved_usd: data.costSaved,
}));
\`\`\`

After deploying, transactions went from frozen at 2,052 to 3,451 in one day.`,
  },
];
