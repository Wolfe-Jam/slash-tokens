# Slash Tokenizer Calibration Report

**Date:** 2026-04-16
**Corpus:** 9 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| opus-4.6 | 0.762 | 0.876 | 1.064 | -23.8% | -12.4% | 6.4% |
| opus-4.7 | 0.571 | 0.716 | 0.938 | -42.9% | -28.4% | -6.2% |

## 4.6 → 4.7 Tokenizer Delta

| Corpus | Type | 4.6 tokens | 4.7 tokens | Ratio (4.7/4.6) |
|--------|------|-----------|-----------|----------------|
| ts-function | code | 141 | 160 | 1.135x |
| python-class | code | 282 | 349 | 1.238x |
| rust-struct | code | 292 | 367 | 1.257x |
| technical-docs | prose | 239 | 336 | 1.406x |
| conversational | prose | 170 | 257 | 1.512x |
| api-response | json | 1789 | 2076 | 1.16x |
| config-yaml-as-json | json | 237 | 284 | 1.198x |
| readme-excerpt | markdown | 223 | 288 | 1.291x |
| mixed-code-prose | mixed | 245 | 328 | 1.339x |

## Raw Results

| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |
|--------|------|-------|--------|-----------|-------|-------|
| ts-function | code | opus-4.6 | 141 | 150 | 1.064 | 6.4% |
| ts-function | code | opus-4.7 | 160 | 150 | 0.938 | -6.2% |
| python-class | code | opus-4.6 | 282 | 255 | 0.904 | -9.6% |
| python-class | code | opus-4.7 | 349 | 255 | 0.731 | -26.9% |
| rust-struct | code | opus-4.6 | 292 | 243 | 0.832 | -16.8% |
| rust-struct | code | opus-4.7 | 367 | 243 | 0.662 | -33.8% |
| technical-docs | prose | opus-4.6 | 239 | 192 | 0.803 | -19.7% |
| technical-docs | prose | opus-4.7 | 336 | 192 | 0.571 | -42.9% |
| conversational | prose | opus-4.6 | 170 | 149 | 0.876 | -12.4% |
| conversational | prose | opus-4.7 | 257 | 149 | 0.58 | -42% |
| api-response | json | opus-4.6 | 1789 | 1554 | 0.869 | -13.1% |
| api-response | json | opus-4.7 | 2076 | 1554 | 0.749 | -25.1% |
| config-yaml-as-json | json | opus-4.6 | 237 | 214 | 0.903 | -9.7% |
| config-yaml-as-json | json | opus-4.7 | 284 | 214 | 0.754 | -24.6% |
| readme-excerpt | markdown | opus-4.6 | 223 | 170 | 0.762 | -23.8% |
| readme-excerpt | markdown | opus-4.7 | 288 | 170 | 0.59 | -41% |
| mixed-code-prose | mixed | opus-4.6 | 245 | 235 | 0.959 | -4.1% |
| mixed-code-prose | mixed | opus-4.7 | 328 | 235 | 0.716 | -28.4% |

## Reproduction

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts
```
