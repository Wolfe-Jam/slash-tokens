# Slash Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 9 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| opus-4.7 | 0.571 | 0.716 | 0.938 | -42.9% | -28.4% | -6.2% |

## Raw Results

| Corpus | Type | Model | Actual | Estimated | Ratio | Delta |
|--------|------|-------|--------|-----------|-------|-------|
| ts-function | code | opus-4.7 | 160 | 150 | 0.938 | -6.2% |
| python-class | code | opus-4.7 | 349 | 255 | 0.731 | -26.9% |
| rust-struct | code | opus-4.7 | 367 | 243 | 0.662 | -33.8% |
| technical-docs | prose | opus-4.7 | 336 | 192 | 0.571 | -42.9% |
| conversational | prose | opus-4.7 | 257 | 149 | 0.58 | -42% |
| api-response | json | opus-4.7 | 2076 | 1556 | 0.75 | -25% |
| config-yaml-as-json | json | opus-4.7 | 284 | 214 | 0.754 | -24.6% |
| readme-excerpt | markdown | opus-4.7 | 288 | 170 | 0.59 | -41% |
| mixed-code-prose | mixed | opus-4.7 | 328 | 235 | 0.716 | -28.4% |

## Reproduction

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun bench/calibrate.ts
```
