# Slash Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 9 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| opus-4.7 | 0.571 | 0.716 | 0.938 | -42.9% | -28.4% | -6.2% |
| sonnet-5 | 0.58 | 0.728 | 0.968 | -42% | -27.2% | -3.2% |
| haiku-4.5 | 0.762 | 0.876 | 1.064 | -23.8% | -12.4% | 6.4% |

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

## Reproduction

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts
```
