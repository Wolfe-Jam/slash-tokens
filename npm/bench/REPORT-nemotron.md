# Slash Tokenizer Calibration Report — NVIDIA Nemotron

**Date:** 2026-10-08
**Ground truth:** the real Nemotron tokenizer, run locally (`nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16` @ `2dc98e2`, Hugging Face `tokenizers` 0.22.1). Content only, no special tokens or chat template, the same basis as the other reports.
**Models:** Nemotron 3 Nano, Super, Ultra and 3.5 Lightning share one BPE tokenizer (131,072 vocab; identical vocab, merges and pre-tokenizer). The corpus counts are identical on all four files (8,464 tokens).
**Corpus:** 29 samples (code, prose, json, markdown, mixed)
**Reproduce:** `npm run bench:nemotron` (needs `uv`)

## Summary

| Min ratio | Median | Max | Needs factor ≥ | Factor set |
|-----------|--------|-----|----------------|------------|
| 0.828 (api-response) | 1.038 | 1.511 | 1.208 | **1.30** (7.6% headroom) |

Before this run, Nemotron took the unknown-model default (2.05), 70% above what even the worst sample needs (1.208). With 1.30 the tightest sample is 7.6% over its real count and no sample is under. `tests/accuracy-gate.test.ts` holds that in CI.

## Raw results (raw WASM estimate, no factor)

| Corpus | Type | Actual | Estimated | Ratio | Delta |
|--------|------|--------|-----------|-------|-------|
| ts-function | code | 105 | 150 | 1.429 | 42.9% |
| python-class | code | 268 | 255 | 0.951 | -4.9% |
| rust-struct | code | 235 | 243 | 1.034 | 3.4% |
| technical-docs | prose | 218 | 192 | 0.881 | -11.9% |
| conversational | prose | 164 | 149 | 0.909 | -9.1% |
| api-response | json | 1879 | 1556 | 0.828 | -17.2% |
| config-yaml-as-json | json | 199 | 214 | 1.075 | 7.5% |
| readme-excerpt | markdown | 200 | 170 | 0.85 | -15% |
| mixed-code-prose | mixed | 210 | 235 | 1.119 | 11.9% |
| go-http-handler | code | 203 | 289 | 1.424 | 42.4% |
| java-spring-service | code | 176 | 266 | 1.511 | 51.1% |
| sql-schema-queries | code | 211 | 222 | 1.052 | 5.2% |
| bash-deploy-script | code | 208 | 215 | 1.034 | 3.4% |
| react-component | code | 261 | 284 | 1.088 | 8.8% |
| news-style | prose | 178 | 178 | 1 | 0% |
| legal-clause | prose | 170 | 163 | 0.959 | -4.1% |
| academic-abstract | prose | 197 | 208 | 1.056 | 5.6% |
| marketing-landing-copy | prose | 149 | 139 | 0.933 | -6.7% |
| prose-spanish | prose | 160 | 166 | 1.038 | 3.8% |
| prose-japanese | prose | 206 | 309 | 1.5 | 50% |
| emoji-social-post | prose | 161 | 181 | 1.124 | 12.4% |
| graphql-response | json | 963 | 867 | 0.9 | -10% |
| ecommerce-order | json | 385 | 349 | 0.906 | -9.4% |
| error-response | json | 207 | 195 | 0.942 | -5.8% |
| changelog | markdown | 200 | 204 | 1.02 | 2% |
| tutorial-howto | markdown | 185 | 220 | 1.189 | 18.9% |
| chat-transcript | mixed | 216 | 268 | 1.241 | 24.1% |
| stack-trace-debug | mixed | 266 | 328 | 1.233 | 23.3% |
| financial-report-table | mixed | 284 | 299 | 1.053 | 5.3% |
