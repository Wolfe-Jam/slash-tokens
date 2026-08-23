# Slash Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 29 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| opus-4.7 | 0.517 | 0.716 | 1.136 | -48.3% | -28.4% | 13.6% |
| sonnet-5 | 0.525 | 0.728 | 1.162 | -47.5% | -27.2% | 16.2% |
| haiku-4.5 | 0.744 | 0.903 | 1.179 | -25.6% | -9.7% | 17.9% |

## Raw Results

| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |
|--------|------|-------|--------|-----------|-------|-------|
| ts-function | code | opus-4.7 | 160 | 150 | 0.938 | -6.2% |
| ts-function | code | sonnet-5 | 155 | 150 | 0.968 | -3.2% |
| ts-function | code | haiku-4.5 | 141 | 150 | 1.064 | 6.4% |
| python-class | code | opus-4.7 | 349 | 255 | 0.731 | -26.9% |
| python-class | code | sonnet-5 | 344 | 255 | 0.741 | -25.9% |
| python-class | code | haiku-4.5 | 282 | 255 | 0.904 | -9.6% |
| rust-struct | code | opus-4.7 | 367 | 243 | 0.662 | -33.8% |
| rust-struct | code | sonnet-5 | 362 | 243 | 0.671 | -32.9% |
| rust-struct | code | haiku-4.5 | 292 | 243 | 0.832 | -16.8% |
| technical-docs | prose | opus-4.7 | 336 | 192 | 0.571 | -42.9% |
| technical-docs | prose | sonnet-5 | 331 | 192 | 0.58 | -42% |
| technical-docs | prose | haiku-4.5 | 239 | 192 | 0.803 | -19.7% |
| conversational | prose | opus-4.7 | 257 | 149 | 0.58 | -42% |
| conversational | prose | sonnet-5 | 252 | 149 | 0.591 | -40.9% |
| conversational | prose | haiku-4.5 | 170 | 149 | 0.876 | -12.4% |
| api-response | json | opus-4.7 | 2076 | 1556 | 0.75 | -25% |
| api-response | json | sonnet-5 | 2071 | 1556 | 0.751 | -24.9% |
| api-response | json | haiku-4.5 | 1789 | 1556 | 0.87 | -13% |
| config-yaml-as-json | json | opus-4.7 | 284 | 214 | 0.754 | -24.6% |
| config-yaml-as-json | json | sonnet-5 | 279 | 214 | 0.767 | -23.3% |
| config-yaml-as-json | json | haiku-4.5 | 237 | 214 | 0.903 | -9.7% |
| readme-excerpt | markdown | opus-4.7 | 288 | 170 | 0.59 | -41% |
| readme-excerpt | markdown | sonnet-5 | 283 | 170 | 0.601 | -39.9% |
| readme-excerpt | markdown | haiku-4.5 | 223 | 170 | 0.762 | -23.8% |
| mixed-code-prose | mixed | opus-4.7 | 328 | 235 | 0.716 | -28.4% |
| mixed-code-prose | mixed | sonnet-5 | 323 | 235 | 0.728 | -27.2% |
| mixed-code-prose | mixed | haiku-4.5 | 245 | 235 | 0.959 | -4.1% |
| go-http-handler | code | opus-4.7 | 359 | 289 | 0.805 | -19.5% |
| go-http-handler | code | sonnet-5 | 354 | 289 | 0.816 | -18.4% |
| go-http-handler | code | haiku-4.5 | 267 | 289 | 1.082 | 8.2% |
| java-spring-service | code | opus-4.7 | 337 | 266 | 0.789 | -21.1% |
| java-spring-service | code | sonnet-5 | 332 | 266 | 0.801 | -19.9% |
| java-spring-service | code | haiku-4.5 | 256 | 266 | 1.039 | 3.9% |
| sql-schema-queries | code | opus-4.7 | 420 | 222 | 0.529 | -47.1% |
| sql-schema-queries | code | sonnet-5 | 415 | 222 | 0.535 | -46.5% |
| sql-schema-queries | code | haiku-4.5 | 253 | 222 | 0.877 | -12.3% |
| bash-deploy-script | code | opus-4.7 | 405 | 215 | 0.531 | -46.9% |
| bash-deploy-script | code | sonnet-5 | 400 | 215 | 0.538 | -46.2% |
| bash-deploy-script | code | haiku-4.5 | 238 | 215 | 0.903 | -9.7% |
| react-component | code | opus-4.7 | 397 | 284 | 0.715 | -28.5% |
| react-component | code | sonnet-5 | 392 | 284 | 0.724 | -27.6% |
| react-component | code | haiku-4.5 | 317 | 284 | 0.896 | -10.4% |
| news-style | prose | opus-4.7 | 284 | 178 | 0.627 | -37.3% |
| news-style | prose | sonnet-5 | 279 | 178 | 0.638 | -36.2% |
| news-style | prose | haiku-4.5 | 184 | 178 | 0.967 | -3.3% |
| legal-clause | prose | opus-4.7 | 266 | 163 | 0.613 | -38.7% |
| legal-clause | prose | sonnet-5 | 261 | 163 | 0.625 | -37.5% |
| legal-clause | prose | haiku-4.5 | 183 | 163 | 0.891 | -10.9% |
| academic-abstract | prose | opus-4.7 | 319 | 208 | 0.652 | -34.8% |
| academic-abstract | prose | sonnet-5 | 314 | 208 | 0.662 | -33.8% |
| academic-abstract | prose | haiku-4.5 | 214 | 208 | 0.972 | -2.8% |
| marketing-landing-copy | prose | opus-4.7 | 243 | 139 | 0.572 | -42.8% |
| marketing-landing-copy | prose | sonnet-5 | 238 | 139 | 0.584 | -41.6% |
| marketing-landing-copy | prose | haiku-4.5 | 168 | 139 | 0.827 | -17.3% |
| prose-spanish | prose | opus-4.7 | 321 | 166 | 0.517 | -48.3% |
| prose-spanish | prose | sonnet-5 | 316 | 166 | 0.525 | -47.5% |
| prose-spanish | prose | haiku-4.5 | 220 | 166 | 0.755 | -24.5% |
| prose-japanese | prose | opus-4.7 | 272 | 309 | 1.136 | 13.6% |
| prose-japanese | prose | sonnet-5 | 266 | 309 | 1.162 | 16.2% |
| prose-japanese | prose | haiku-4.5 | 262 | 309 | 1.179 | 17.9% |
| emoji-social-post | prose | opus-4.7 | 234 | 181 | 0.774 | -22.6% |
| emoji-social-post | prose | sonnet-5 | 229 | 181 | 0.79 | -21% |
| emoji-social-post | prose | haiku-4.5 | 174 | 181 | 1.04 | 4% |
| graphql-response | json | opus-4.7 | 1340 | 867 | 0.647 | -35.3% |
| graphql-response | json | sonnet-5 | 1335 | 867 | 0.649 | -35.1% |
| graphql-response | json | haiku-4.5 | 1165 | 867 | 0.744 | -25.6% |
| ecommerce-order | json | opus-4.7 | 477 | 349 | 0.732 | -26.8% |
| ecommerce-order | json | sonnet-5 | 472 | 349 | 0.739 | -26.1% |
| ecommerce-order | json | haiku-4.5 | 416 | 349 | 0.839 | -16.1% |
| error-response | json | opus-4.7 | 279 | 195 | 0.699 | -30.1% |
| error-response | json | sonnet-5 | 274 | 195 | 0.712 | -28.8% |
| error-response | json | haiku-4.5 | 235 | 195 | 0.83 | -17% |
| changelog | markdown | opus-4.7 | 278 | 204 | 0.734 | -26.6% |
| changelog | markdown | sonnet-5 | 273 | 204 | 0.747 | -25.3% |
| changelog | markdown | haiku-4.5 | 208 | 204 | 0.981 | -1.9% |
| tutorial-howto | markdown | opus-4.7 | 268 | 220 | 0.821 | -17.9% |
| tutorial-howto | markdown | sonnet-5 | 262 | 220 | 0.84 | -16% |
| tutorial-howto | markdown | haiku-4.5 | 205 | 220 | 1.073 | 7.3% |
| chat-transcript | mixed | opus-4.7 | 350 | 268 | 0.766 | -23.4% |
| chat-transcript | mixed | sonnet-5 | 345 | 268 | 0.777 | -22.3% |
| chat-transcript | mixed | haiku-4.5 | 239 | 268 | 1.121 | 12.1% |
| stack-trace-debug | mixed | opus-4.7 | 424 | 328 | 0.774 | -22.6% |
| stack-trace-debug | mixed | sonnet-5 | 419 | 328 | 0.783 | -21.7% |
| stack-trace-debug | mixed | haiku-4.5 | 316 | 328 | 1.038 | 3.8% |
| financial-report-table | mixed | opus-4.7 | 388 | 299 | 0.771 | -22.9% |
| financial-report-table | mixed | sonnet-5 | 382 | 299 | 0.783 | -21.7% |
| financial-report-table | mixed | haiku-4.5 | 304 | 299 | 0.984 | -1.6% |

## Reproduction

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts
```
