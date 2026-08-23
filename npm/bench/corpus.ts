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

  // ============================================================
  // Expansion 2026-08-23 — non-self-referential, third-party-style
  // content across more languages/formats. Added to reduce the
  // 9-sample-and-mostly-about-us bias flagged as a known limitation
  // in src/slash.ts's calibration comment.
  // ============================================================

  // --- Code (more languages) ---
  {
    name: 'go-http-handler',
    type: 'code',
    content: `package main

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status    string    \`json:"status"\`
	Timestamp time.Time \`json:"timestamp"\`
	Uptime    int64     \`json:"uptime_seconds"\`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	resp := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
		Uptime:    int64(time.Since(startTime).Seconds()),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

var startTime = time.Now()

func main() {
	http.HandleFunc("/health", healthHandler)
	http.ListenAndServe(":8080", nil)
}`,
  },
  {
    name: 'java-spring-service',
    type: 'code',
    content: `@Service
public class InventoryService {

    private final InventoryRepository repository;
    private final EventPublisher eventPublisher;

    public InventoryService(InventoryRepository repository, EventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void reserveStock(String sku, int quantity) {
        InventoryItem item = repository.findBySku(sku)
            .orElseThrow(() -> new ItemNotFoundException(sku));

        if (item.getAvailable() < quantity) {
            throw new InsufficientStockException(sku, quantity, item.getAvailable());
        }

        item.setAvailable(item.getAvailable() - quantity);
        item.setReserved(item.getReserved() + quantity);
        repository.save(item);

        eventPublisher.publish(new StockReservedEvent(sku, quantity, Instant.now()));
    }
}`,
  },
  {
    name: 'sql-schema-queries',
    type: 'code',
    content: `CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_status ON orders (customer_id, status)
    WHERE status IN ('pending', 'processing');

SELECT
    c.name,
    COUNT(o.id) AS order_count,
    SUM(o.total_cents) / 100.0 AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND o.status = 'completed'
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 3
ORDER BY total_spent DESC
LIMIT 20;`,
  },
  {
    name: 'bash-deploy-script',
    type: 'code',
    content: `#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="\${1:-staging}"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "Deploying to \${ENVIRONMENT} with tag \${IMAGE_TAG}..."

docker build -t "registry.example.com/app:\${IMAGE_TAG}" .
docker push "registry.example.com/app:\${IMAGE_TAG}"

if [ "\${ENVIRONMENT}" = "production" ]; then
    read -p "Confirm production deploy? (y/N) " confirm
    if [[ ! "\${confirm}" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

kubectl set image deployment/app app="registry.example.com/app:\${IMAGE_TAG}" \\
    --namespace="\${ENVIRONMENT}"

kubectl rollout status deployment/app --namespace="\${ENVIRONMENT}" --timeout=120s

echo "Deploy complete: \${IMAGE_TAG} live on \${ENVIRONMENT}"`,
  },
  {
    name: 'react-component',
    type: 'code',
    content: `import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

export function ProductList({ categoryId }: { categoryId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(\`/api/products?category=\${categoryId}\`)
      .then(res => res.json())
      .then(data => { if (!cancelled) setProducts(data.products); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [categoryId]);

  if (loading) return <div className="spinner" />;

  return (
    <ul className="product-list">
      {products.map(p => (
        <li key={p.id} className={p.inStock ? '' : 'out-of-stock'}>
          <span>{p.name}</span>
          <span>\${p.price.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}`,
  },

  // --- Prose (styles + non-English) ---
  {
    name: 'news-style',
    type: 'prose',
    content: `Regional transit authorities announced Tuesday a plan to expand the light rail network by twelve stations over the next five years, citing ridership growth of nearly 40 percent since the system's last expansion in 2019. Officials said the $1.2 billion project would be funded through a mix of federal infrastructure grants and a voter-approved sales tax increase passed last November.

Critics of the plan, including several neighborhood associations along the proposed route, argue that construction will disrupt local businesses for years and that the projected ridership numbers rely on overly optimistic growth assumptions. The transit authority's chief planner countered that similar concerns were raised before the 2019 expansion, which ultimately exceeded ridership projections within eighteen months of opening.

Construction is expected to begin in early 2027, with the first new stations opening in phases starting in 2029.`,
  },
  {
    name: 'legal-clause',
    type: 'prose',
    content: `Section 4.2 (Limitation of Liability). Except in cases of gross negligence or willful misconduct, in no event shall either party be liable to the other for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunity, arising out of or related to this Agreement, even if such party has been advised of the possibility of such damages.

The aggregate liability of either party under this Agreement shall not exceed the total fees paid or payable by Client under this Agreement during the twelve (12) months immediately preceding the event giving rise to the claim.

This limitation shall apply regardless of the legal theory on which the claim is based, whether in contract, tort, strict liability, or otherwise, and shall survive termination or expiration of this Agreement.`,
  },
  {
    name: 'academic-abstract',
    type: 'prose',
    content: `We present a study of gradient noise scale as a predictor of optimal batch size in large-scale distributed training. Prior work has established that the critical batch size — beyond which additional parallelism yields diminishing returns in wall-clock training time — varies substantially across model architectures and datasets, but existing heuristics for estimating it require expensive grid search. We propose a lightweight online estimator that tracks the ratio of gradient variance to squared gradient norm during the first several hundred training steps, requiring no additional forward or backward passes beyond standard training.

Across six model families ranging from 125M to 13B parameters, our estimator predicts the empirically-measured critical batch size within a factor of 1.3x on average, compared to 2.1x for the strongest prior baseline. We further show that the estimate stabilizes early enough in training to inform batch size scheduling decisions before more than 2% of the total compute budget has been spent, making it practical for production training pipelines.`,
  },
  {
    name: 'marketing-landing-copy',
    type: 'prose',
    content: `Stop guessing what your infrastructure costs.

Most teams find out their cloud bill is too high the same way they find out a pipe burst — after the damage is done. CostGuard watches every deployment, every autoscaling event, and every idle resource in real time, and tells you exactly where the money is going before the invoice does.

No agents to install. No week-long onboarding. Connect your cloud account, and CostGuard starts surfacing waste within minutes — orphaned volumes, oversized instances, forgotten staging environments still running at 2am on a Saturday.

Teams using CostGuard cut their monthly cloud spend by an average of 23% in the first quarter. Start your free 14-day trial — no credit card required.`,
  },
  {
    name: 'prose-spanish',
    type: 'prose',
    content: `La inteligencia artificial ha transformado la manera en que las empresas gestionan sus operaciones diarias. Desde la automatización de tareas repetitivas hasta el análisis predictivo de grandes volúmenes de datos, estas herramientas permiten a los equipos concentrarse en decisiones estratégicas en lugar de procesos manuales.

Sin embargo, la adopción de estas tecnologías no está exenta de desafíos. Muchas organizaciones subestiman el tiempo necesario para integrar sistemas de inteligencia artificial con su infraestructura existente, lo que puede provocar retrasos significativos y costos adicionales imprevistos.

Los expertos recomiendan comenzar con proyectos piloto de alcance reducido antes de intentar una implementación a gran escala, permitiendo así identificar problemas de integración temprano y ajustar la estrategia según los resultados obtenidos.`,
  },
  {
    name: 'prose-japanese',
    type: 'prose',
    content: `近年、企業のソフトウェア開発において、継続的インテグレーションと継続的デプロイメント(CI/CD)の導入が急速に進んでいる。従来の手動によるテストとデプロイのプロセスは、時間がかかるだけでなく、人為的なミスのリスクも高かった。

CI/CDパイプラインを導入することで、コードの変更が自動的にテストされ、問題がなければ本番環境へと反映される。これにより、開発チームはより頻繁に、かつ安全にリリースを行うことが可能になった。

ただし、CI/CDの導入には初期投資が必要であり、既存のワークフローを大きく変更する必要がある場合も多い。そのため、段階的な移行計画を立てることが成功の鍵となる。`,
  },
  {
    name: 'emoji-social-post',
    type: 'prose',
    content: `okay so we finally shipped the redesign 🎉🚀 took us way longer than expected (3 months instead of 3 weeks 😅) but honestly SO worth it

before: cluttered dashboard, nobody could find anything 😵‍💫
after: clean, fast, actually makes sense ✨

biggest lesson learned: talk to your users BEFORE you redesign, not after 🙃 we did like 40 interviews this time around and it changed everything

anyway if you want to try it it's live now 👇 would love feedback, drop a comment or DM me 💬

thanks to everyone who stuck with us through the beta period 🙏 couldn't have done it without you all ❤️`,
  },

  // --- JSON (more shapes) ---
  {
    name: 'graphql-response',
    type: 'json',
    content: JSON.stringify({
      data: {
        repository: {
          name: "example-app",
          owner: { login: "acme-corp" },
          issues: {
            totalCount: 47,
            nodes: Array.from({ length: 10 }, (_, i) => ({
              number: 100 + i,
              title: `Fix rendering bug in component ${i}`,
              state: i % 3 === 0 ? "CLOSED" : "OPEN",
              labels: { nodes: [{ name: "bug" }, { name: i % 2 === 0 ? "priority-high" : "priority-low" }] },
              author: { login: `contributor${i % 4}` },
            })),
            pageInfo: { hasNextPage: true, endCursor: "MTA" },
          },
        },
      },
    }, null, 2),
  },
  {
    name: 'ecommerce-order',
    type: 'json',
    content: JSON.stringify({
      order_id: "ord_8f3a9c2e",
      customer: { id: "cust_4471", email: "jane.doe@example.com", tier: "gold" },
      items: [
        { sku: "WDG-100", name: "Widget Pro", quantity: 2, unit_price: 24.99, subtotal: 49.98 },
        { sku: "GDT-220", name: "Gadget Mini", quantity: 1, unit_price: 14.5, subtotal: 14.5 },
        { sku: "ACC-050", name: "Carrying Case", quantity: 1, unit_price: 9.99, subtotal: 9.99 },
      ],
      shipping: {
        address: { line1: "742 Evergreen Terrace", city: "Springfield", state: "IL", zip: "62704" },
        method: "standard",
        cost: 5.99,
        estimated_delivery: "2026-09-02",
      },
      totals: { subtotal: 74.47, tax: 5.96, shipping: 5.99, discount: -7.45, total: 78.97 },
      status: "processing",
    }, null, 2),
  },
  {
    name: 'error-response',
    type: 'json',
    content: JSON.stringify({
      error: {
        code: "VALIDATION_FAILED",
        message: "The request could not be processed due to invalid input.",
        status: 422,
        details: [
          { field: "email", issue: "must be a valid email address", received: "not-an-email" },
          { field: "quantity", issue: "must be greater than 0", received: -3 },
        ],
        request_id: "req_c4e9a1b2f8",
        timestamp: "2026-08-23T14:32:07Z",
        stack: [
          "at validateOrderInput (validators/order.ts:42)",
          "at OrderController.create (controllers/order.ts:18)",
          "at Router.handle (router.ts:103)",
        ],
      },
    }, null, 2),
  },

  // --- Markdown (more formats) ---
  {
    name: 'changelog',
    type: 'markdown',
    content: `# Changelog

## [2.4.0] - 2026-08-15

### Added
- New \`--watch\` flag for the build command, re-runs on file changes
- Support for custom output directories via \`config.outDir\`

### Changed
- Default timeout increased from 5s to 15s for large file uploads
- Improved error messages when a required config field is missing

### Fixed
- Fixed a race condition where concurrent writes to the cache could corrupt entries
- Fixed incorrect exit code (0 instead of 1) when the build fails silently

### Deprecated
- \`config.legacyMode\` will be removed in 3.0.0 — migrate to \`config.compatMode\`

## [2.3.1] - 2026-07-28

### Fixed
- Hotfix for a crash on Node 22 when parsing symlinked config files`,
  },
  {
    name: 'tutorial-howto',
    type: 'markdown',
    content: `## Setting up local development

Follow these steps to get the project running on your machine.

1. **Clone the repository**

   \`\`\`bash
   git clone https://github.com/example/project.git
   cd project
   \`\`\`

2. **Install dependencies**

   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables**

   Copy the example env file and fill in your own values:

   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. **Run database migrations**

   \`\`\`bash
   npm run migrate
   \`\`\`

5. **Start the dev server**

   \`\`\`bash
   npm run dev
   \`\`\`

   The app should now be running at \`http://localhost:3000\`.

> **Note:** if port 3000 is already in use, set \`PORT=3001\` in your \`.env\` file before starting.`,
  },

  // --- Mixed (more shapes) ---
  {
    name: 'chat-transcript',
    type: 'mixed',
    content: `**Alice:** Hey, has anyone looked at why the checkout flow is timing out for international customers?

**Bob:** Yeah, I dug into it yesterday. Looks like the tax calculation service has a 3-second timeout, and for some EU addresses it's taking 4-5 seconds to resolve VAT rates.

**Alice:** Ugh, that's not great. Do we know why it's slower specifically for EU addresses?

**Bob:** The provider we use routes EU requests through a different regional endpoint that seems to be under-provisioned. I already opened a ticket with them.

**Carol:** In the meantime, could we just bump our timeout to 8 seconds as a stopgap? Better a slow checkout than a broken one.

**Bob:** Agreed, I'll ship that today. Longer term we should probably cache VAT rates by country/region since they don't change often.

**Alice:** +1 on caching. Can you file a follow-up ticket so it doesn't get lost?

**Bob:** Already done — #4471.`,
  },
  {
    name: 'stack-trace-debug',
    type: 'mixed',
    content: `Getting this error intermittently in production, maybe 1 in every 500 requests:

\`\`\`
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at normalizeHeader (middleware/headers.js:23:19)
    at processRequest (middleware/headers.js:8:5)
    at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
    at next (node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (node_modules/express/lib/router/route.js:114:3)
\`\`\`

The relevant code:

\`\`\`javascript
function normalizeHeader(req) {
  return req.headers['x-request-source'].toLowerCase();
}
\`\`\`

I think the issue is that \`x-request-source\` isn't always sent — probably some older client versions or health-check pings that don't set it. Since it's intermittent and correlates with a small percentage of traffic, that lines up with a specific caller not setting the header rather than a race condition.

Fix should just be an optional-chaining guard with a sensible default:

\`\`\`javascript
function normalizeHeader(req) {
  return (req.headers['x-request-source'] ?? 'unknown').toLowerCase();
}
\`\`\``,
  },
  {
    name: 'financial-report-table',
    type: 'mixed',
    content: `## Q2 2026 Regional Performance

Revenue grew 18% quarter-over-quarter, driven primarily by expansion in the APAC region following the launch of localized pricing tiers in April.

| Region | Q1 Revenue | Q2 Revenue | Growth |
|--------|-----------:|-----------:|-------:|
| North America | $4.2M | $4.5M | +7.1% |
| EMEA | $2.8M | $3.1M | +10.7% |
| APAC | $1.1M | $2.0M | +81.8% |
| LATAM | $0.6M | $0.7M | +16.7% |
| **Total** | **$8.7M** | **$10.3M** | **+18.4%** |

Customer acquisition cost decreased 12% in APAC as word-of-mouth referrals began contributing meaningfully to new signups — referral-sourced customers now account for 22% of new APAC accounts, up from 6% in Q1.

Churn remained flat across all regions except LATAM, where a currency devaluation in one key market drove a temporary 3-point increase in churn among price-sensitive small-business accounts.`,
  },
];
