# xAI (Grok) Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 29 samples (code, prose, json, markdown, mixed)
**Baselines (fixed system-preamble overhead, subtracted from all samples):** {"grok-4.20":185,"grok-4-1-fast":193}

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| grok-4.20 | 0.928 | 1.118 | 2.131 | -7.2% | 11.8% | 113.1% |
| grok-4-1-fast | 0.928 | 1.118 | 2.131 | -7.2% | 11.8% | 113.1% |

## Raw Results

| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |
|--------|------|-------|--------|-----------|-------|-------|
| ts-function | code | grok-4.20 | 102 | 150 | 1.471 | 47.1% |
| ts-function | code | grok-4-1-fast | 102 | 150 | 1.471 | 47.1% |
| python-class | code | grok-4.20 | 246 | 255 | 1.037 | 3.7% |
| python-class | code | grok-4-1-fast | 246 | 255 | 1.037 | 3.7% |
| rust-struct | code | grok-4.20 | 219 | 243 | 1.11 | 11% |
| rust-struct | code | grok-4-1-fast | 219 | 243 | 1.11 | 11% |
| technical-docs | prose | grok-4.20 | 207 | 192 | 0.928 | -7.2% |
| technical-docs | prose | grok-4-1-fast | 207 | 192 | 0.928 | -7.2% |
| conversational | prose | grok-4.20 | 150 | 149 | 0.993 | -0.7% |
| conversational | prose | grok-4-1-fast | 150 | 149 | 0.993 | -0.7% |
| api-response | json | grok-4.20 | 1561 | 1556 | 0.997 | -0.3% |
| api-response | json | grok-4-1-fast | 1561 | 1556 | 0.997 | -0.3% |
| config-yaml-as-json | json | grok-4.20 | 188 | 214 | 1.138 | 13.8% |
| config-yaml-as-json | json | grok-4-1-fast | 188 | 214 | 1.138 | 13.8% |
| readme-excerpt | markdown | grok-4.20 | 169 | 170 | 1.006 | 0.6% |
| readme-excerpt | markdown | grok-4-1-fast | 169 | 170 | 1.006 | 0.6% |
| mixed-code-prose | mixed | grok-4.20 | 194 | 235 | 1.211 | 21.1% |
| mixed-code-prose | mixed | grok-4-1-fast | 194 | 235 | 1.211 | 21.1% |
| go-http-handler | code | grok-4.20 | 186 | 289 | 1.554 | 55.4% |
| go-http-handler | code | grok-4-1-fast | 186 | 289 | 1.554 | 55.4% |
| java-spring-service | code | grok-4.20 | 169 | 266 | 1.574 | 57.4% |
| java-spring-service | code | grok-4-1-fast | 169 | 266 | 1.574 | 57.4% |
| sql-schema-queries | code | grok-4.20 | 197 | 222 | 1.127 | 12.7% |
| sql-schema-queries | code | grok-4-1-fast | 197 | 222 | 1.127 | 12.7% |
| bash-deploy-script | code | grok-4.20 | 185 | 215 | 1.162 | 16.2% |
| bash-deploy-script | code | grok-4-1-fast | 185 | 215 | 1.162 | 16.2% |
| react-component | code | grok-4.20 | 254 | 284 | 1.118 | 11.8% |
| react-component | code | grok-4-1-fast | 254 | 284 | 1.118 | 11.8% |
| news-style | prose | grok-4.20 | 164 | 178 | 1.085 | 8.5% |
| news-style | prose | grok-4-1-fast | 164 | 178 | 1.085 | 8.5% |
| legal-clause | prose | grok-4.20 | 161 | 163 | 1.012 | 1.2% |
| legal-clause | prose | grok-4-1-fast | 161 | 163 | 1.012 | 1.2% |
| academic-abstract | prose | grok-4.20 | 188 | 208 | 1.106 | 10.6% |
| academic-abstract | prose | grok-4-1-fast | 188 | 208 | 1.106 | 10.6% |
| marketing-landing-copy | prose | grok-4.20 | 143 | 139 | 0.972 | -2.8% |
| marketing-landing-copy | prose | grok-4-1-fast | 143 | 139 | 0.972 | -2.8% |
| prose-spanish | prose | grok-4.20 | 148 | 166 | 1.122 | 12.2% |
| prose-spanish | prose | grok-4-1-fast | 148 | 166 | 1.122 | 12.2% |
| prose-japanese | prose | grok-4.20 | 145 | 309 | 2.131 | 113.1% |
| prose-japanese | prose | grok-4-1-fast | 145 | 309 | 2.131 | 113.1% |
| emoji-social-post | prose | grok-4.20 | 137 | 181 | 1.321 | 32.1% |
| emoji-social-post | prose | grok-4-1-fast | 137 | 181 | 1.321 | 32.1% |
| graphql-response | json | grok-4.20 | 921 | 867 | 0.941 | -5.9% |
| graphql-response | json | grok-4-1-fast | 921 | 867 | 0.941 | -5.9% |
| ecommerce-order | json | grok-4.20 | 346 | 349 | 1.009 | 0.9% |
| ecommerce-order | json | grok-4-1-fast | 346 | 349 | 1.009 | 0.9% |
| error-response | json | grok-4.20 | 190 | 195 | 1.026 | 2.6% |
| error-response | json | grok-4-1-fast | 190 | 195 | 1.026 | 2.6% |
| changelog | markdown | grok-4.20 | 184 | 204 | 1.109 | 10.9% |
| changelog | markdown | grok-4-1-fast | 184 | 204 | 1.109 | 10.9% |
| tutorial-howto | markdown | grok-4.20 | 178 | 220 | 1.236 | 23.6% |
| tutorial-howto | markdown | grok-4-1-fast | 178 | 220 | 1.236 | 23.6% |
| chat-transcript | mixed | grok-4.20 | 202 | 268 | 1.327 | 32.7% |
| chat-transcript | mixed | grok-4-1-fast | 202 | 268 | 1.327 | 32.7% |
| stack-trace-debug | mixed | grok-4.20 | 246 | 328 | 1.333 | 33.3% |
| stack-trace-debug | mixed | grok-4-1-fast | 246 | 328 | 1.333 | 33.3% |
| financial-report-table | mixed | grok-4.20 | 260 | 299 | 1.15 | 15% |
| financial-report-table | mixed | grok-4-1-fast | 260 | 299 | 1.15 | 15% |

## Reproduction

```bash
XAI_API_KEY=xai-xxx bun bench/calibrate-grok.ts
```
