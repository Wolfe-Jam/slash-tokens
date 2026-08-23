# Gemini Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 29 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| gemini-3.1-pro | 0.749 | 1.004 | 2.074 | -25.1% | 0.4% | 107.4% |
| gemini-2.5-flash | 0.749 | 1.004 | 2.074 | -25.1% | 0.4% | 107.4% |

## Raw Results

| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |
|--------|------|-------|--------|-----------|-------|-------|
| ts-function | code | gemini-3.1-pro | 123 | 150 | 1.22 | 22% |
| ts-function | code | gemini-2.5-flash | 123 | 150 | 1.22 | 22% |
| python-class | code | gemini-3.1-pro | 295 | 255 | 0.864 | -13.6% |
| python-class | code | gemini-2.5-flash | 295 | 255 | 0.864 | -13.6% |
| rust-struct | code | gemini-3.1-pro | 268 | 243 | 0.907 | -9.3% |
| rust-struct | code | gemini-2.5-flash | 268 | 243 | 0.907 | -9.3% |
| technical-docs | prose | gemini-3.1-pro | 213 | 192 | 0.901 | -9.9% |
| technical-docs | prose | gemini-2.5-flash | 213 | 192 | 0.901 | -9.9% |
| conversational | prose | gemini-3.1-pro | 171 | 149 | 0.871 | -12.9% |
| conversational | prose | gemini-2.5-flash | 171 | 149 | 0.871 | -12.9% |
| api-response | json | gemini-3.1-pro | 2024 | 1556 | 0.769 | -23.1% |
| api-response | json | gemini-2.5-flash | 2024 | 1556 | 0.769 | -23.1% |
| config-yaml-as-json | json | gemini-3.1-pro | 220 | 214 | 0.973 | -2.7% |
| config-yaml-as-json | json | gemini-2.5-flash | 220 | 214 | 0.973 | -2.7% |
| readme-excerpt | markdown | gemini-3.1-pro | 207 | 170 | 0.821 | -17.9% |
| readme-excerpt | markdown | gemini-2.5-flash | 207 | 170 | 0.821 | -17.9% |
| mixed-code-prose | mixed | gemini-3.1-pro | 222 | 235 | 1.059 | 5.9% |
| mixed-code-prose | mixed | gemini-2.5-flash | 222 | 235 | 1.059 | 5.9% |
| go-http-handler | code | gemini-3.1-pro | 244 | 289 | 1.184 | 18.4% |
| go-http-handler | code | gemini-2.5-flash | 244 | 289 | 1.184 | 18.4% |
| java-spring-service | code | gemini-3.1-pro | 204 | 266 | 1.304 | 30.4% |
| java-spring-service | code | gemini-2.5-flash | 204 | 266 | 1.304 | 30.4% |
| sql-schema-queries | code | gemini-3.1-pro | 241 | 222 | 0.921 | -7.9% |
| sql-schema-queries | code | gemini-2.5-flash | 241 | 222 | 0.921 | -7.9% |
| bash-deploy-script | code | gemini-3.1-pro | 212 | 215 | 1.014 | 1.4% |
| bash-deploy-script | code | gemini-2.5-flash | 212 | 215 | 1.014 | 1.4% |
| react-component | code | gemini-3.1-pro | 283 | 284 | 1.004 | 0.4% |
| react-component | code | gemini-2.5-flash | 283 | 284 | 1.004 | 0.4% |
| news-style | prose | gemini-3.1-pro | 179 | 178 | 0.994 | -0.6% |
| news-style | prose | gemini-2.5-flash | 179 | 178 | 0.994 | -0.6% |
| legal-clause | prose | gemini-3.1-pro | 165 | 163 | 0.988 | -1.2% |
| legal-clause | prose | gemini-2.5-flash | 165 | 163 | 0.988 | -1.2% |
| academic-abstract | prose | gemini-3.1-pro | 195 | 208 | 1.067 | 6.7% |
| academic-abstract | prose | gemini-2.5-flash | 195 | 208 | 1.067 | 6.7% |
| marketing-landing-copy | prose | gemini-3.1-pro | 150 | 139 | 0.927 | -7.3% |
| marketing-landing-copy | prose | gemini-2.5-flash | 150 | 139 | 0.927 | -7.3% |
| prose-spanish | prose | gemini-3.1-pro | 149 | 166 | 1.114 | 11.4% |
| prose-spanish | prose | gemini-2.5-flash | 149 | 166 | 1.114 | 11.4% |
| prose-japanese | prose | gemini-3.1-pro | 149 | 309 | 2.074 | 107.4% |
| prose-japanese | prose | gemini-2.5-flash | 149 | 309 | 2.074 | 107.4% |
| emoji-social-post | prose | gemini-3.1-pro | 137 | 181 | 1.321 | 32.1% |
| emoji-social-post | prose | gemini-2.5-flash | 137 | 181 | 1.321 | 32.1% |
| graphql-response | json | gemini-3.1-pro | 1157 | 867 | 0.749 | -25.1% |
| graphql-response | json | gemini-2.5-flash | 1157 | 867 | 0.749 | -25.1% |
| ecommerce-order | json | gemini-3.1-pro | 430 | 349 | 0.812 | -18.8% |
| ecommerce-order | json | gemini-2.5-flash | 430 | 349 | 0.812 | -18.8% |
| error-response | json | gemini-3.1-pro | 240 | 195 | 0.813 | -18.7% |
| error-response | json | gemini-2.5-flash | 240 | 195 | 0.813 | -18.7% |
| changelog | markdown | gemini-3.1-pro | 201 | 204 | 1.015 | 1.5% |
| changelog | markdown | gemini-2.5-flash | 201 | 204 | 1.015 | 1.5% |
| tutorial-howto | markdown | gemini-3.1-pro | 203 | 220 | 1.084 | 8.4% |
| tutorial-howto | markdown | gemini-2.5-flash | 203 | 220 | 1.084 | 8.4% |
| chat-transcript | mixed | gemini-3.1-pro | 227 | 268 | 1.181 | 18.1% |
| chat-transcript | mixed | gemini-2.5-flash | 227 | 268 | 1.181 | 18.1% |
| stack-trace-debug | mixed | gemini-3.1-pro | 309 | 328 | 1.061 | 6.1% |
| stack-trace-debug | mixed | gemini-2.5-flash | 309 | 328 | 1.061 | 6.1% |
| financial-report-table | mixed | gemini-3.1-pro | 279 | 299 | 1.072 | 7.2% |
| financial-report-table | mixed | gemini-2.5-flash | 279 | 299 | 1.072 | 7.2% |

## Reproduction

```bash
GEMINI_API_KEY=AIzaxxx bun bench/calibrate-gemini.ts
```
