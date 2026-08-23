# Gemini Tokenizer Calibration Report

**Date:** 2026-08-23
**Corpus:** 9 samples (code, prose, json, markdown, mixed)

## Summary

| Model | Min Ratio | Median | Max | Min Delta | Median | Max |
|-------|-----------|--------|-----|-----------|--------|-----|
| gemini-3.1-pro | 0.768 | 0.901 | 1.22 | -23.2% | -9.9% | 22% |
| gemini-2.5-flash | 0.768 | 0.901 | 1.22 | -23.2% | -9.9% | 22% |

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
| api-response | json | gemini-3.1-pro | 2026 | 1556 | 0.768 | -23.2% |
| api-response | json | gemini-2.5-flash | 2026 | 1556 | 0.768 | -23.2% |
| config-yaml-as-json | json | gemini-3.1-pro | 220 | 214 | 0.973 | -2.7% |
| config-yaml-as-json | json | gemini-2.5-flash | 220 | 214 | 0.973 | -2.7% |
| readme-excerpt | markdown | gemini-3.1-pro | 207 | 170 | 0.821 | -17.9% |
| readme-excerpt | markdown | gemini-2.5-flash | 207 | 170 | 0.821 | -17.9% |
| mixed-code-prose | mixed | gemini-3.1-pro | 222 | 235 | 1.059 | 5.9% |
| mixed-code-prose | mixed | gemini-2.5-flash | 222 | 235 | 1.059 | 5.9% |

## Reproduction

```bash
GEMINI_API_KEY=AIzaxxx bun bench/calibrate-gemini.ts
```
