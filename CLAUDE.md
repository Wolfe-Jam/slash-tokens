<!-- faf:start -->
<!-- faf: slash-tokens | TypeScript | library | Token optimization for Context Engineers — pre-flight checks on every LLM API call, sub-millisecond, 4.8 KB WASM -->
<!-- faf: claim=project.faf | family=FAF -->

# CLAUDE.md — slash-tokens

## What This Is

Token optimization for Context Engineers — pre-flight checks on every LLM API call, sub-millisecond, 4.8 KB WASM

## Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Build:** Bun
- **CI/CD:** GitHub Actions
- **Package Manager:** npm

## Context

- **Who:** Context Engineers building with LLMs (Claude, OpenAI, xAI, Google) who want pre-call cost visibility and automatic routing to cheaper same-provider models
- **What:** 4.8 KB Zig-compiled WASM SDK — estimates tokens, costs, and routes LLM calls pre-send. preflight() for cross-provider analysis, preflightRoute() for the same-provider routing decision the Slash proxy makes
- **Why:** Most apps waste 40-80% of tokens calling frontier models for tasks that fit smaller ones. Slash decides pre-call, not after the invoice. Don't go to the corner shop in a Ferrari.
- **Where:** npm (slash-tokens), slashtokens.com, GitHub (Wolfe-Jam/slash-tokens), mcpaas.live/slash
- **When:** v1.6.7, The Fixed Deal Edition (2026-10-08): one very large request (about 1 MB of text) no longer skews every count after it. Part of FAF Slash, the token meter for FAF.
- **How:** npm install slash-tokens or bunx slash-tokens. One import (slash-tokens/auto) intercepts every fetch to Anthropic/OpenAI/xAI/Google endpoints pre-call.

---

*STATUS: SYNC ACTIVE — 2026-10-08T11:54:30.065Z*
<!-- faf:end -->
