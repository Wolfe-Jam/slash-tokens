<!-- faf:start -->
<!-- faf: slash-tokens | TypeScript | library | Token optimization for Context Engineers — pre-flight checks on every LLM API call, sub-millisecond, 4.8 KB WASM -->
<!-- faf: claim=project.faf | family=FAF -->

# CLAUDE.md — slash-tokens

## What This Is

Token optimization for Context Engineers — pre-flight checks on every LLM API call, sub-millisecond, 4.8 KB WASM

## Stack

- **Language:** TypeScript

## Context

- **Who:** Context Engineers building with LLMs (Claude, OpenAI, xAI, Google) who want pre-call cost visibility and automatic routing to cheaper same-provider models
- **What:** 4.8 KB Zig-compiled WASM SDK and the agent you hire — quote() prices a job, decide() books the right model under a budget and quality floor, reconcile() proves it with a receipt, hire().run() does all three. preflight() / preflightRoute() for per-call checks — every cheaper option, and the cheapest same-provider swap
- **Why:** Most apps waste 40-80% of tokens calling frontier models for tasks that fit smaller ones. Slash decides pre-call, not after the invoice. Don't go to the corner shop in a Ferrari.
- **Where:** npm (slash-tokens), slashtokens.com, GitHub (Wolfe-Jam/slash-tokens), mcpaas.live/slash
- **When:** v1.7.0, The Hired Agent Edition (2026-10-08): quote the job, book the right model, prove it with a receipt. Part of FAF Slash, the token meter for FAF.
- **How:** npm install slash-tokens or bunx slash-tokens. One import (slash-tokens/auto) intercepts every fetch to Anthropic/OpenAI/xAI/Google endpoints pre-call.

---

*STATUS: SYNC ACTIVE — 2026-10-08T13:05:31.055Z*
<!-- faf:end -->
