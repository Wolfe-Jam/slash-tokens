# xAI (Grok) Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 9 samples (code, prose, json, markdown, mixed)
**Baselines (fixed system-preamble overhead, subtracted from all samples):** {"grok-4.20":185,"grok-4-1-fast":193}

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| grok-4.20 | 0.928 | 1.037 | 1.471 | -7.2% | 3.7% | 47.1% |
| grok-4-1-fast | 0.928 | 1.037 | 1.471 | -7.2% | 3.7% | 47.1% |

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
| api-response | json | grok-4.20 | 1561 | 1555 | 0.996 | -0.4% |
| api-response | json | grok-4-1-fast | 1561 | 1555 | 0.996 | -0.4% |
| config-yaml-as-json | json | grok-4.20 | 188 | 214 | 1.138 | 13.8% |
| config-yaml-as-json | json | grok-4-1-fast | 188 | 214 | 1.138 | 13.8% |
| readme-excerpt | markdown | grok-4.20 | 169 | 170 | 1.006 | 0.6% |
| readme-excerpt | markdown | grok-4-1-fast | 169 | 170 | 1.006 | 0.6% |
| mixed-code-prose | mixed | grok-4.20 | 194 | 235 | 1.211 | 21.1% |
| mixed-code-prose | mixed | grok-4-1-fast | 194 | 235 | 1.211 | 21.1% |

## Reproduction

```bash
XAI_API_KEY=xai-xxx bun bench/calibrate-grok.ts
```
