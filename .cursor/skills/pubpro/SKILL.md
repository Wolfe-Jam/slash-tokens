---
name: pubpro
description: FAF publish protocol for npm + MCP Registry + Cloudflare Workers. Run pre-publish checklist, verify build/tests, prepare approval request. Covers all 5 FAF ecosystem servers + CLI + MCPaaS.
---

<!-- faf: pubpro | markdown | skill | FAF publish protocol for npm + MCP Registry + Cloudflare Workers. Run pre-publish checklist, verify build/tests, prepare approval request... -->
<!-- faf: doc=skill | family=FAF | related=pubpypi,pubcrate,pubblog,pubproof,pubbetter,pubvscode | canonical=memory/cross-ai-2-line-meta-stamp.md -->

# PubPro - FAF Publish Protocol

**Before running any build/test/publish command:** check whether one is already running — `pgrep -fl "npm (run|test|publish)|node|wrangler|cargo (build|test)"` first. Two concurrent builds can collide on the same lockfile, port, or `target/`/`node_modules` state and both stall silently. An empty output file from a backgrounded, `| tail`-piped command does not mean it's stuck (tail withholds output until the pipe closes) — redirect straight to a log file and read that instead. Only treat it as genuinely stuck if `ps aux` CPU time is unchanged across two checks minutes apart.

Run the FAF publish protocol checklist before any npm/PyPI/Cloudflare publish.

**Sibling mechanical pubs** (same Doc Gate identity — §1.5 / §1.55 — even when Trophy is skipped):

| Skill | Registry | Notes |
|-------|----------|--------|
| **`/pubpro`** | npm + MCP (FAF family) | **Canonical Doc Gate** lives here |
| **`/pubpypi`** | PyPI | FAF Python **and** de-faffed (e.g. `claude-fafm-sdk` → `/pubpypi fafm`) |
| **`/pubcrate`** | crates.io | FAF Rust crates. Dual cargo+npm (e.g. rust-faf-mcp) = **this skill AND `/pubcrate`** — two registries, two pubs. Memory: `doctrine-pub-series-only-two-registries-two-pubs` |
| **`/pubbetter`** | crates + MCP Registry | mcp-better only · BETTER purity · still uses Doc Gate identity |
| **`/pubvscode`** | VS Code Marketplace + Open VSX | `faf-vscode` extension · **CI (`release.yml`) is the executor** — this skill is the pre-tag gate + tag + verify. No Edition/oneliner, no MCP gates. References §1.05 + §10. |
| **`/pubproof`** | (pre-gate) | Claim integrity before mechanical pub |
| **`/pubaaif`** | npm + MCP Registry (GitHub OIDC only) | AAIF-lane repos (vendor-neutral `project_contribution`s, e.g. `mcp-context-card`) — **not** the same thing as "de-faffed" below: still no Edition name, no `one.faf` namespace, no docs.faf.one page. Doc Gate's Version/Oneliner/What's New survive; Title-as-Edition does not. |

De-faffed apps **do not** invent a separate “pubdoc” skill — they call their registry pub and **must still pass Doc Gate** (Title · Edition · Version · Oneliner · What's New = this version). This is a different axis from `/pubaaif`: de-faffing strips FAF's *branding* from a template a builder will own, but the ship is still FAF's own — full Doc Gate ceremony applies. An AAIF submission strips FAF's *ceremony* because the audience is a neutral scoring body — `/pubaaif` is that lane.

**Doc identity (all profiles — CLI and MCP):** every minor/feature release locks **four fields** once (§1.5 / §1.55), then stamps them **verbatim** on every human-facing surface. MCP does **not** skip Edition or Oneliner — it adds registry/tool gates on top.

| Field | Alias | Where it must match |
|-------|--------|---------------------|
| **Version #** | version | package.json · CHANGELOG · README · server.json · manifest.json (MCP) |
| **Title (Edition)** | edition-name | CHANGELOG `## [X.Y.Z] — The <Name> Edition` · README What's New · GH release title |
| **Short description** | oneliner | CHANGELOG lead · README What's New lead · GH release notes lead |
| **What's New** | this version only | README + CHANGELOG narrative for **this** ship (not prior-edition bulk) |

> 📦 **Backed up** (private) to `Wolfe-Jam/faf-skills-ops`. After editing this skill, run `bash ~/FAF/faf-skills-ops/sync.sh` to keep the off-machine backup current (don't let it drift into a stale snapshot).

## Usage

```
/pubpro            # Interactive menu (recommended)
/pubpro cli        # faf-cli package (npm)
/pubpro mcp        # claude-faf-mcp — MCP profile (npm + MCP Registry + mcpb)
/pubpro faf-mcp    # faf-mcp package (npm + MCP)
/pubpro grok       # grok-faf-mcp package (npm + MCP)
/pubpro gemini     # gemini-faf-mcp package (PyPI + MCP)
/pubpro mcpaas     # mcpaas-cf (Cloudflare Workers)
/pubpro slash      # slash-tokens package (npm)
/pubpro bun        # bun-sticky package (npm, Bun-native · tag-triggered CI)
```

**`/pubpro mcp` = claude-faf-mcp full MCP profile** (not a lighter checklist). Same Doc Gate as CLI for Edition + Oneliner, **plus** §1.6 tool surface · §1.7 mcpb · §8 registry · compose-floor checks. See **§ MCP profile (claude-faf-mcp)** below.

## Publish Scope

After package selection, ask for publish scope:

```
Question: "What scope for this publish?"
Header: "Scope"
Options:
  - label: "npm/PyPI only"
    description: "Package registry only (quick release)"
  - label: "Full Ecosystem (Recommended)"
    description: "npm/PyPI + MCP Registry + all listings"
```

## The Five Fingers - FAF Ecosystem #2759

| Server | Registry `name` (current) | npm/PyPI | Notes |
|--------|---------------------------|----------|--------|
| **Claude (CFM)** | `one.faf/claude-faf-mcp` | npm `claude-faf-mcp` | Display **title** from `project.faf` → server-card; DNS registry auto-publish |
| **Core FAF** | check `server.json` (migrate toward `one.faf/*`) | npm `faf-mcp` | Compose faf-cli floor — same playbook as CFM |
| **Grok** | check `server.json` | npm `grok-faf-mcp` | Same |
| **Gemini** | check `server.json` | PyPI `gemini-faf-mcp` | Tag-triggered publish |
| **WJTTC** | check `server.json` | npm | Testing certification |

**Legacy:** older listings may still show `io.github.Wolfe-Jam/*` — **do not re-introduce** that namespace on new ships. Prefer `one.faf/<name>` + DNS auth.

**Plus CLI:** faf-cli (npm + Homebrew · dual-publish `faf`)  
**Plus Infrastructure:** mcpaas-cf (Cloudflare Workers)  
**Plus Product:** slash-tokens (npm)

## Package Paths

| Argument | Package | Path | Registry |
|----------|---------|------|----------|
| `cli` | faf-cli | `/Users/wolfejam/FAF/cli` | npm + Homebrew |
| `mcp` | claude-faf-mcp | `/Users/wolfejam/FAF/claude-faf-mcp` | npm + MCP |
| `faf-mcp` | faf-mcp | `/Users/wolfejam/FAF/faf-mcp` | npm + MCP |
| `grok` | grok-faf-mcp | `/Users/wolfejam/FAF/grok-faf-mcp` | npm + MCP |
| `gemini` | gemini-faf-mcp | `/Users/wolfejam/FAF/gemini-faf-mcp` | PyPI + MCP |
| `mcpaas` | mcpaas-cf | `/Users/wolfejam/FAF/mcpaas-cf` | Cloudflare Workers |
| `slash` | slash-tokens | `/Users/wolfejam/FAF/slash-tokens/npm` | npm |
| `bun` | bun-sticky | `/Users/wolfejam/FAF/bun-sticky-faf` | npm (local publish) |
| — | rust-faf-mcp | `/Users/wolfejam/FAF/rust-faf-mcp` | **Not `/pubpro` alone.** Dual: crates.io (native) + npm (`npx` shim). Run **`/pubcrate rust-mcp` and `/pubpro`**. |

## Package Profiles — which gates apply

Not every package is an MCP server. The **profile** decides which gates run and how it ships. Skipping an MCP gate on a CLI is correct; skipping one on an MCP server is a defect.

| Profile | Packages | MCP-only gates (1.6 count/reachability · 1.7 mcpb-sha · 8 registry · 8.5 Smithery) | Publish |
|---------|----------|------|---------|
| **MCP server** | claude · faf-mcp · grok · gemini | **RUN all** + **§1.55-MCP** (edition/oneliner surface map) | npm/PyPI → GH release + mcpb → registry |
| **CLI / library** | faf-cli · slash · **bun** | **SKIP** MCP-only | per package (below) |
| **Infra** | mcpaas | SKIP MCP-only | **Auto-deploy on merge to `main`** (`.github/workflows/deploy.yml`) — **the merge is the GO**. See § Auto-deploy repos. |

**Every profile runs the core gates** (no exceptions): 1.05 branch-consolidation · 1.1 CI · 1.25 FAF Trophy · **1.5 Doc-Gate (version · edition · oneliner)** · **1.5b docs.faf.one** · 2 dry-run · 4.5 commit+push · 5–6 approval (GO!) · 9.5 release-CI · 10 truth-table.

### Auto-deploy repos — the merge is the GO

*Codified 2026-09-27 after mcpaas-cf #47: the always-33 change auto-deployed on merge, and the version bump, CHANGELOG, FAF Trophy + sync and tag/release were all skipped — the merge happened before /pubpro's pre-GO steps. wolfejam: "auto-deploy is good but we will have to make sure we dont skip anything." Memory: `feedback-auto-deploy-merge-is-go`.*

A repo whose `main` deploys itself (mcpaas-cf `deploy.yml`; Cloudflare Workers Builds; Cloudflare Pages / Vercel Git) ships **when the PR merges**. So:

1. **Detect first.** `ls .github/workflows/ | grep -i deploy` and the PR's checks (a `Workers Builds:` / Pages / Vercel check). If `main` deploys, the PR **is** the release.
2. **Every pre-GO gate runs on the PR:** 1.05 · 1.1 · 1.25 Trophy + sync · 1.5 Doc Gate (version bump + CHANGELOG + edition + oneliner) · 2 dry-run (`npx wrangler@4 deploy --dry-run`) · 3 tests.
3. **The PR body carries the Step 5 approval table** and says plainly: *merging this PR deploys it.*
4. **wolfejam merges last — the merge is the GO.** Never merge it yourself.
5. **Right after the deploy:** Step 7.5 post-deploy verification (live checks + post-deploy suite) → Step 9 tag + GitHub release → Step 10 truth-table.
6. **One deployer only.** If the merge commit shows two production deploys (e.g. GitHub Actions `deploy` *and* Cloudflare `Workers Builds` both running `wrangler deploy`), the last finisher wins from a different build — flag it to wolfejam.
   - **mcpaas-cf (since 2026-09-28): hybrid, one deployer.** Workers Builds' production deploy command is `npx wrangler versions upload` — it builds every PR + merge and uploads a version (preview + dashboard rollback) but never promotes. `deploy.yml` is the only production deployer and `needs: test` (`npm run test:taf`, also run on PRs). A `Workers Builds` check on the merge commit is expected and fine; a second *deploy* is not.
   - **mcpaas-cf Worker Previews (since 2026-09-28):** every PR gets an isolated Preview (Workers Builds runs `npx wrangler preview`): its own SOULS KV `faf-mcpaas-preview` (10 public demo souls), Previews Base secrets = Turnstile test + preview-only WRITE_TOKEN/ADMIN_PW, no Stripe/Resend/GitHub/xAI/signing keys (`src/preview-guard.ts` strips them). Before merge, run `TEST_URL=<branch preview URL> npx vitest run tests/wjttc/post-deploy.test.ts` — 63/63 on the first smoke test. Local wrangler uses the OAuth login (`npx wrangler login`). Never export `CF_API_TOKEN` / `CLOUDFLARE_API_TOKEN` in the shell — wrangler prefers them over OAuth. The read-only analytics token is `CF_ANALYTICS_TOKEN` (renamed 2026-09-28).

### MCP profile (`/pubpro mcp` = claude-faf-mcp)

**Order of ship (atomic):** Doc Gate (version + **edition-name + oneliner**) → Trophy → dry-run → tests → commit+push → GO → npm → GH release **+ mcpb** → registry (auto for CFM) → truth-table.

**Pre-flight checklist (MCP-specific — do not skip):**

1. **Doc identity locked** — Version · Edition · Oneliner confirmed with wolfejam (§1.55); CHANGELOG/README/GH match.  
2. **Doc Gate 101** — includes `server.json` + `manifest.json` versions.  
3. **§1.55-MCP** — surface map understood (registry card ≠ release oneliner).  
4. **§1.6** — Core tool count honest (CFM: **12** default); headline claim reachable.  
5. **Compose floor** — if `faf-cli` was bumped: pin in package.json, E2E suite green, CHANGELOG claims bounded (kill lines).  
6. **§1.7** — real mcpb sha in server.json; build once.  
7. **Namespace** — `server.json.name` is `one.faf/...` (not `io.github...` for new ships).  
8. **No `faf_enhance`** — removed from CFM; do not re-list in tool counts or docs.  
9. **Registry** — CFM auto on `release: published`; do not double-publish manually.  
10. **PubProof** (claim-bearing editions) — run `/pubproof` before GO when the release asserts compose/Edition/parity claims.

**Sibling MCP bump pattern (faf-mcp · grok-faf-mcp):** same Doc Gate + same compose playbook (`faf-cli` floor) — do not fork Turbo-Cat.

**Publish path:** `npm publish` locally (faf-cli · slash · claude · faf-mcp · grok · **bun**) · **tag-triggered CI** (gemini/PyPI) — for the tag-triggered ones the repo's `release.yml` publishes on a `v*` tag, so never run `npm publish` by hand for those, and never add `npm publish` to a repo whose CI already publishes (Step 9.5). **bun-sticky publishes LOCALLY** like faf-cli — it has **no CI publish** (`release.yml` was removed 2026-07-08 per *CI validates, pubpro publishes — never both*; every version incl. 2.0.0/2.1.0 shipped by local `npm publish`). Still cut the `v*` tag + GH release as the marker.

## The Protocol

> ### ⚛️ Release Atomicity — read this FIRST
> **A release is ONE continuous /pubpro motion** — bump → gates → GO → **npm publish → tag → GH Release → truth-table**, start-to-coherent in minutes. Do **NOT** pre-cut the tag + GitHub Release in one session and leave the npm publish for a "later /pubpro." The gap lets `main` **drift off the tag** (a PR merges in between) → this run's `HEAD == tag` coherence check fires **STOP**, and /pubpro ends up *reconciling* a release it didn't run instead of shipping one (it stops feeling like a /pubpro because it isn't one).
> - **Tag and publish are the SAME motion.** Never push a `v*` tag until you're publishing npm right after it.
> - **If you must stage** (prep now, ship later): hold a version-bump commit on a branch — but do **not push the tag** until ship time.
> - **STOP at `HEAD == tag`?** You split a release. Fix with a **fresh coherent patch** (e.g. 7.1.1 → 7.1.2), **never force-move a published tag.**
>
> *Codified 2026-07-10 after faf-cli 7.1.1→7.1.2: the tag + GH Release were cut one evening with npm deferred; PR #102 merged into the ~7h gap and drifted `main` off the tag, so the next /pubpro's first gate said STOP. Memory: `doctrine-pubpro-release-is-atomic-dont-split-tag-from-publish`.*

### Step 0: Package Selection (if no argument)

If `/pubpro` is called without an argument, use **AskUserQuestion** to present an interactive menu:

```
Question: "Which package do you want to publish?"
Header: "Package"
Options:
  - label: "faf-cli"
    description: "/Users/wolfejam/FAF/cli - CLI tool (npm + Homebrew)"
  - label: "claude-faf-mcp"
    description: "/Users/wolfejam/FAF/claude-faf-mcp - MCP server (npm + MCP Registry)"
  - label: "faf-mcp"
    description: "/Users/wolfejam/FAF/faf-mcp - Core MCP (npm + MCP Registry)"
  - label: "grok-faf-mcp"
    description: "/Users/wolfejam/FAF/grok-faf-mcp - Grok MCP (npm + MCP Registry)"
  - label: "gemini-faf-mcp"
    description: "/Users/wolfejam/FAF/gemini-faf-mcp - Gemini MCP (PyPI + MCP Registry)"
  - label: "mcpaas-cf"
    description: "/Users/wolfejam/FAF/mcpaas-cf - MCPaaS (Cloudflare Workers)"
  - label: "slash-tokens"
    description: "/Users/wolfejam/FAF/slash-tokens/npm - Pre-flight checks (npm)"
  - label: "bun-sticky"
    description: "/Users/wolfejam/FAF/bun-sticky-faf - Bun-native FAF scorer (npm, tag-triggered CI, CLI profile)"
```

### Step 1: Change to Package Directory

Based on argument or menu selection, cd to the correct path.

### Step 1.05: Branch Consolidation Gate (MANDATORY — publish from a coherent main, ALL publish routines)

**You cannot ship what isn't on `main`. Stranded feature branches = work the published version silently lacks, and the CI gate below (which only checks `main`) would wave it through.** This gate consolidates outstanding work onto `main` and prunes the branch graveyard *before* anything else. It applies to EVERY publish routine (pubpro, pubpypi, pubcrate, pubblog) — codified 2026-06-06 after the mcpaas-cf ship surfaced ~18 stale local branches + diverged work that had to be untangled by hand. `/publish` (spray) was archived 2026-08-18 — do not restore it as a publish routine.

**1. Inventory — which remote branches are NOT yet on main:**

```bash
git fetch origin --prune --quiet
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's|^origin/||' | grep -v '^main$\|^HEAD$'); do
  ahead=$(git rev-list --count origin/main..origin/$b 2>/dev/null)
  [ "$ahead" != "0" ] && [ -n "$ahead" ] && echo "⚠️  origin/$b — $ahead unmerged commit(s)"
done
```

**2. For each unmerged branch, judge it by its REAL content — never the tip diff:**

```bash
# ❌ git diff origin/main origin/<b>  → MISLEADING: shows main's newer work as
#    "deletions" (staleness artifact). A stale branch can look like a 3000-line
#    change when its commit touched 2 files.
# ✅ Use the branch's own commit delta + staleness:
mb=$(git merge-base origin/main origin/<b>)
git diff --stat $mb origin/<b>                       # what the branch ACTUALLY changed
git rev-list --count origin/<b>..origin/main         # how many commits stale (behind main)
```

**3. Decide per branch (this is the judgment, not a rubber stamp):**

| Situation | Action |
|-----------|--------|
| Real, current, clean work | **Merge** into main (`git merge --no-ff`) |
| Real work but stale / would conflict / 1–2 commits | **Cherry-pick** the commit(s); resolve conflicts |
| Superseded (main already has an equivalent fix) | **Skip** — drop the branch, it's done |
| Very stale docs/cosmetic (e.g. README 25 behind) | **Skip + flag** — re-do from current main, don't merge ancient base |
| Receipt / CI-log branch (e.g. `taf-receipts`, `[skip ci]` commits) | **NEVER merge to main** — separate by design |

**When more than one real feature branch is unmerged, ASK the user which to fold in** (use AskUserQuestion) — `main` is the deploy/publish line; don't pull surprise features into a release. `feat`-branches that are clearly *this session's* work fold in by default.

**4. Verify the consolidated main BEFORE pushing:**

```bash
npx tsc --noEmit 2>&1 | head        # or the repo's typecheck
npm test 2>&1 | tail -5             # or the local suite (skip live-network tests)
```

**5. Push main, then delete every branch that's now incorporated:**

```bash
git push origin main

# Remote: delete branches whose work is now on main
git push origin --delete <merged-branch> [<merged-branch> ...]

# Local: prune stale branches. Squash-/cherry-picked branches won't show as
# merged by ancestry → `git branch -d` refuses them. Confirm the work is on main
# (you just did, in steps 2–4), then force-delete:
git branch -D <stale-branch> [<stale-branch> ...]
```

**Gotchas (all hit live on the mcpaas-cf consolidation):**
- **Squash-merged PRs break ancestry.** A branch shipped via squash-PR (#32-style) shows as "unmerged" and its original commit still floats in another branch — a plain merge auto-resolves the duplicate (identical content), but `git branch -d` won't recognize it; use `-D` after confirming content is on main.
- **Worktree-checked-out branches can't be deleted** (the `+` marker in `git branch -vv`). Leave them or `git worktree remove` first.
- **Local `[origin/...: gone]` branches** = remote already deleted post-PR. Safe to `-D` prune (their work shipped).
- **Never `git add -A`** during conflict resolution — stage by name.

**6. PRUNE incorporated leftovers — the "after-sweep" lives HERE, not after the ship.** *(Added 2026-06-26 — wolfejam: "why are we always doing git sweeps after publishes?" Answer: the prune was deferred to an "after" that never came, so ancient dead branches re-surfaced at every ship. Steps 1–5 consolidate unmerged WORK; this deletes the already-incorporated branches that lingered from prior ships — automatically, every ship, BEFORE publish.)* Run it **silently** (the `echo`s are a log trail, not a prompt — never turn a dead branch into a user decision):

```bash
# Safe set ONLY: remote branches 0-ahead of main (fully incorporated) + local
# branches that are ancestors of main. NEVER touch by-design branches:
# taf-receipts, any *receipt* / CI-log / [skip ci] branch (they match `receipt`).
git fetch origin --prune --quiet
PROTECTED='^(main|HEAD)$|receipt'

# Remote: delete branches fully incorporated (0 commits ahead of main).
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's|^origin/||' | grep -vE "$PROTECTED"); do
  ahead=$(git rev-list --count origin/main..origin/$b 2>/dev/null)
  [ "$ahead" = "0" ] && { echo "prune remote: origin/$b (0-ahead, incorporated)"; git push origin --delete "$b"; }
done

# Local: delete branches that are ancestors of main (work is already on main).
cur=$(git branch --show-current)
for b in $(git for-each-ref --format='%(refname:short)' refs/heads | grep -vE "$PROTECTED"); do
  [ "$b" = "$cur" ] && continue   # never the checked-out branch
  git merge-base --is-ancestor "$b" main 2>/dev/null && { echo "prune local: $b (ancestor of main)"; git branch -d "$b"; }
done
```

This makes "clean repo" a *precondition* of every ship — there is never an "after" sweep again.

**Gate passes when:** `git branch -vv` shows only `main` (+ any intentional live worktree/feature branches), `origin/main` has all the work you intend to ship, and typecheck + local tests are green. THEN proceed to the CI gate.

### Step 1.1: CI Gate (MANDATORY — no red buttons on npm)

**Check GitHub Actions CI status before anything else. A red badge on npm is permanent damage.**

```bash
# Get the repo from package.json
REPO=$(node -e "const p=require('./package.json'); const u=p.repository?.url||''; const m=u.match(/github\.com[\/:]([^\/]+\/[^\/\.]+)/); console.log(m?m[1]:'unknown')")

# Check latest CI run on main
gh run list --repo "$REPO" --branch main --limit 5 --json status,conclusion,name,createdAt \
  --jq '.[] | "\(.conclusion // .status) \(.name) \(.createdAt)"'
```

**Rules:**
- All jobs must show `success` — no `failure`, no `cancelled`
- If any job is `in_progress`, **wait** — do not publish while CI is running
- If any job shows `failure` — **BLOCKED. Fix CI first. Do not proceed.**

**Present status to user:**
- ✅ CI green — proceed
- ⏳ CI in progress — wait and re-check
- 🚫 CI red — BLOCKED, show which job failed

#### Step 1.1b: Gate-Coverage Check (MANDATORY — green ≠ covered)

*Codified 2026-06-28 after faf-cli 7.0 shipped with a Windows path bug: `ci.yml` had a green badge but DELIBERATELY EXCLUDES Windows, so "CI green" never meant "Windows works"; the only Windows gate lived in `release.yml` and ran POST-tag. The completeness audit "reasoned" Windows was fine instead of running it. This is the 3rd repeat of the same class (epoll/badge, reachability 5.14.0, Windows) — a GREEN gate that doesn't RUN the failure mode, trusted as verified. See `memory/doctrine-coverage-before-green-no-post-tag-gates.md`.*

**A green light is not coverage. Before continuing, NAME the gate that actually RUNS each platform/surface/claim — and refuse to pass anything on reasoning.**

```bash
# 1. What OSes does the CI you just checked ACTUALLY run? (grep the matrix, don't assume)
grep -nE "os:\s*\[|matrix|runs-on|windows|macos|ubuntu|excluded" .github/workflows/*.yml
```

Checklist — every YES must point at a workflow+job that RAN green pre-ship:
- [ ] **Every supported OS** is in the **pre-ship** CI matrix (the one the badge tracks). An OS excluded from it (e.g. `# Windows excluded`) is **UNVERIFIED** — do NOT claim it works.
- [ ] **No platform/surface gated ONLY post-tag** (e.g. a Windows matrix that exists only in `release.yml`/`release:` triggers). Post-tag = caught after the irreversible step = not a gate. Either move it pre-ship or drop the claim.
- [ ] **Workflows agree.** If one workflow documents an exclusion, every other workflow reflects the SAME decision. A split (excluded in `ci.yml`, gated in `release.yml`) is the defect.
- [ ] **Headline feature / claim** is exercised by a RUNNING test on the DEFAULT surface (the reachability lesson, Step 1.6) — not merely present in source.

**Anything you can't point a green RUN at = UNVERIFIED. Stamp it, surface it to wolfejam, do NOT tick it on judgment.** "It should work" / "I reasoned it's fine" is exactly how the FAIL gets through.

**Do NOT continue to Step 1.25 until CI is confirmed green AND gate-coverage is confirmed.**

### Step 1.25: FAF Gate (MANDATORY — no package ships without FAF standard)

**Every FAF package must meet the FAF standard before publish. No exceptions.**

Run these checks automatically — do NOT ask the user, just do them:

```bash
# 1. Check faf_version — if old or missing, regenerate
bun ~/FAF/cli/src/cli.ts score 2>/dev/null
# If faf_version < 3.0, run:
bun ~/FAF/cli/src/cli.ts init --force

# 2. Auto-fill what we can
bun ~/FAF/cli/src/cli.ts auto

# 3. Score
bun ~/FAF/cli/src/cli.ts score
```

**If human_context slots are empty:**
- Fill them yourself using project knowledge (README, package.json, description)
- who: target users
- what: one-line description
- why: the problem it solves
- where: registries, deployment URLs
- when: version, ship date
- how: install/usage command

**If database/connection are empty but irrelevant (e.g. MCP server, CLI):**
- Set to `slotignored`

**Score requirement — Trophy Edition (v6.6.0+):**

- **✪ Trophy 100%** — **required to ship.** This is the only approved state for FAF-family packages.
- **Sub-Trophy (anything below 100%)** — **BLOCKED. Cannot publish.** Fix empty slots, re-score, sync, then retry.

**Why all-or-nothing** (per `memory/trophy-is-the-target.md` 2026-05-09):

```
Layer 4   AI tooling          ← AI optimised by complete FCL
Layer 3   Agents              ← can act because FCL is complete
Layer 2   MD instructions     ← can be regenerated correctly
Layer 1   .faf (FCL)          ← ✪ Trophy = complete = foundation
```

100% on Layer 1 is what makes Layers 2–4 work. Sub-100% degrades every layer above it — AI guesses on the gaps. Halfway is the trap. "Bronze 85% — ship with note" was retired at v6.6.0.

**Sub-Trophy recovery loop:**

1. Identify empty slots: `bun ~/FAF/cli/src/cli.ts score` (read the slot-by-slot output)
2. Fill them per the human_context / slotignored rules above
3. Re-run `auto` + `score` until ✪ lands
4. Then continue to step 4 (sync) below

```bash
# 4. MANDATORY: sync AFTER score — 100% ✪ must be followed by sync, no exceptions
bun ~/FAF/cli/src/cli.ts sync
```

**⚠️ SYNC IS MANDATORY AFTER SCORE — DO NOT SKIP**
A 100% ✪ score that is not followed by `faf sync` is incomplete. The sync locks in the score into CLAUDE.md and MEMORY.md. Commit any changes sync produces before proceeding.

**After FAF Gate passes:**
- project.faf is current spec (v3.0+)
- All applicable slots populated
- Score is **✪ Trophy 100%** (v6.6.0+ requirement — no sub-Trophy publishes)
- `faf sync` has been run and changes committed
- CLAUDE.md has one-liner meta stamp
- Proceed to Step 1.5

### Step 1.5: Documentation Gate (CRITICAL — quality bar, not Y/N file-existence check)

**npm bakes the README into the tarball at publish time. Once published, it's effectively permanent.** This step is NOT *"does the README exist? does the CHANGELOG have an entry?"* — it asks a quality question (wolfejam doctrine 2026-05-11, locked in `memory/doc-gate-quality-bar-not-yn-check.md`):

> **"Does the README professionally portray this version, and help a dev, builder, or even a non-tech (as far as is reasonable) — in plain English, with simple flow?"**

If the answer isn't a clear yes, the gate hasn't passed — even if all files exist.

**THE 4-FIELD MODEL (a release's doc identity — every check below is one of these):**

| Field | Rule | Enforced by |
|-------|------|-------------|
| **Version #** | match **everywhere** (verbatim) | Doc Gate 101 — package.json · CHANGELOG metastamp + entry · README · **server.json** · **manifest.json** (MCP) |
| **Title (Edition)** | match **everywhere** on **doc/release** surfaces | Step 1.55 — CHANGELOG header · README What's New · GH release title. **Patch → NO new edition** (inherits the minor's). **Not** injected into `server.json` product `title` unless product title *is* the edition (it usually is not — e.g. CFM `title: Claude FAF` stays) |
| **Short description** | match **everywhere** on **doc/release** surfaces (verbatim) | Step 1.55 — CHANGELOG lead · README What's New lead · GH release-notes lead. **Alias: oneliner.** Not the same as package.json long product description or preserved `server.json.description` |
| **Extended description** | detail only where needed | Free to be richer in CHANGELOG bullets / README body |

**Short ≠ extended. Oneliner ≠ package description ≠ registry description.**  
- **Oneliner** = this *version's* one sentence (Edition story).  
- **package.json / server.json description** = long-lived product blurb (may stay stable across patches).  
Do not force the registry card to equal the release oneliner unless you deliberately change the emitter.

**Doc Gate passes when:** the 4 fields obey their rule **AND** (MCP servers) Tool-Count + Headline Reachability (Step 1.6) is green. Sub-checks: Doc Gate 101 (v#) · Step 1.55 (edition + oneliner) · Step 1.6 (tools) · Step 1.55-MCP (surface map).

**Doc Gate 101 (MANDATORY — mechanical, runs FIRST, refuses on drift):**

*"doc gate 101 does the version # match on all docs?" — wolfejam, 2026-05-29.* The answer must be deterministic, not a human visual cross-check. **A gate that can be skimmed isn't a gate; it's a sign.** This block is the gate.

Receipt: the 1.4.5 grok-faf-mcp ship had `latest=v1.4.1` sitting eight lines above `## [1.4.5]` in the same `CHANGELOG.md`. The human cross-check waved it green three times because the eye glides past comment-shaped lines. Mechanical comparison can't be skimmed.

```bash
# Doc Gate 101 — mechanical version-stamp consistency check.
# Compares every version stamp across docs to package.json (the npm contract).
# Exits 1 on ANY mismatch — the gate refuses until aligned.
# Portable: POSIX-compatible; runs in bash and zsh without associative arrays.

pkg=$(node -e "console.log(require('./package.json').version)" 2>/dev/null)
[ -z "$pkg" ] && { echo "❌ package.json.version unreadable"; exit 1; }

drift=0

# CHANGELOG HTML-comment meta-stamp:  <!-- ... latest=vX.Y.Z ... -->
meta=$(grep -oE 'latest=v[0-9]+\.[0-9]+\.[0-9]+' CHANGELOG.md 2>/dev/null | head -1 | sed 's/latest=v//')
if [ -n "$meta" ] && [ "$meta" != "$pkg" ]; then
  echo "❌ CHANGELOG meta-stamp = $meta (expected $pkg)"
  drift=1
fi

# CHANGELOG topmost entry header:  ## [X.Y.Z]
top=$(grep -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' CHANGELOG.md 2>/dev/null | head -1 | tr -d '[]## ')
if [ -n "$top" ] && [ "$top" != "$pkg" ]; then
  echo "❌ CHANGELOG entry = $top (expected $pkg)"
  drift=1
fi

# README architecture-tree stamp:  <package-name> vX.Y.Z
name=$(node -e "console.log(require('./package.json').name)" 2>/dev/null)
readme=$(grep -oE "${name} v[0-9]+\.[0-9]+\.[0-9]+" README.md 2>/dev/null | head -1 | sed "s/${name} v//")
if [ -n "$readme" ] && [ "$readme" != "$pkg" ]; then
  echo "❌ README arch-tree = $readme (expected $pkg)"
  drift=1
fi

# soul.fafm namepoint generation:  namepoint: "@pkg:X.Y" — IF soul.fafm is used, its
# minor line MUST match the package minor (patches don't bump it). Silently drifted
# at TWO ships as a soft warn; here it's a hard gate. (memory: gate-soul-fafm-namepoint-must-match)
if [ -f soul.fafm ]; then
  # extract the X.Y generation from  namepoint: "@pkg:X.Y"  (no $ anchor — the line ends with a quote)
  soulgen=$(grep -oE 'namepoint:[[:space:]]*"@[^:"]+:[0-9]+\.[0-9]+"' soul.fafm 2>/dev/null | grep -oE '[0-9]+\.[0-9]+')
  pkgmin=$(echo "$pkg" | cut -d. -f1-2)
  if [ -n "$soulgen" ] && [ "$soulgen" != "$pkgmin" ]; then
    echo "❌ soul.fafm namepoint = $soulgen (expected $pkgmin) — bump namepoint to \"@${name}:${pkgmin}\""
    drift=1
  fi
fi

# Other manifests that carry the package version (faf-cli: .claude-plugin/plugin.json;
# any repo: project.faf's top-level `version:`). Missed at faf-cli 8.2.1, caught by CI.
for f in .claude-plugin/plugin.json; do
  if [ -f "$f" ]; then
    v=$(node -e "try{console.log(require('./$f').version||'')}catch(e){console.log('')}" 2>/dev/null)
    if [ -n "$v" ] && [ "$v" != "$pkg" ]; then echo "❌ $f version = $v (expected $pkg)"; drift=1; fi
  fi
done
if [ -f project.faf ]; then
  pv=$(grep -m1 -E '^[[:space:]]+version:[[:space:]]*"?[0-9]+\.[0-9]+\.[0-9]+' project.faf | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  if [ -n "$pv" ] && [ "$pv" != "$pkg" ]; then echo "❌ project.faf version = $pv (expected $pkg)"; drift=1; fi
fi

# MCP: server.json + manifest.json version must match package.json (registry + mcpb)
if [ -f server.json ]; then
  sj=$(node -e "try{console.log(require('./server.json').version||'')}catch(e){console.log('')}" 2>/dev/null)
  if [ -n "$sj" ] && [ "$sj" != "$pkg" ]; then
    echo "❌ server.json.version = $sj (expected $pkg)"
    drift=1
  fi
fi
if [ -f manifest.json ]; then
  mj=$(node -e "try{console.log(require('./manifest.json').version||'')}catch(e){console.log('')}" 2>/dev/null)
  if [ -n "$mj" ] && [ "$mj" != "$pkg" ]; then
    echo "❌ manifest.json.version = $mj (expected $pkg) — bump before pack:mcpb"
    drift=1
  fi
fi

if [ "$drift" -eq 1 ]; then
  echo ""
  echo "🚫 Doc Gate 101 REFUSED — version stamps disagree across docs."
  echo "   Fix every mismatch above, re-run. No skim, no override."
  exit 1
fi

echo "✅ Doc Gate 101: all version stamps agree on v$pkg"
```

**Only after `✅ Doc Gate 101` prints does the four-part quality check below begin.** The mechanical floor protects the human ceiling. Skipping the floor doesn't earn the ceiling.

**Four-part quality check:**

1. **Professionally portray this version?**
   - **README HTML header** (`<h1>name vX.Y</h1>` + edition name) updated — *separate from the markdown body, easy to miss; audit it explicitly*
   - **Edition-explainer section** (`## vX.Y — Edition Name`) exists and explains what this edition brings, in brand voice (not generic feature copy)
   - No stale prior-edition framing in current-edition slots (historical prior-edition refs in older sections STAY as receipts — see `memory/prior-edition-refs-are-receipts.md`)
   - CHANGELOG entry exists and matches README narrative

2. **Helps a dev?**
   - Install command on the page
   - Workflow line (e.g. `Init > Auto > Go = 100%` — one-glance flow)
   - Commands table or pointer
   - Tier / scoring system explained

3. **Helps a builder?**
   - Architecture or engine references where they exist
   - SDK / interop pointers
   - Receipts visible (IANA, Anthropic-listing, MCP Registry, etc.)

4. **Helps a non-tech (as far as is reasonable)?**
   - Plain-English opening lines (no jargon wall before the user has bought in)
   - Visible benefit statement
   - File-tree diagram or visual aid for the core concept
   - Brand voice avoiding lab-speak

**Read each file cold, as a stranger:**

```bash
cat README.md      # Cold-stranger test — does it portray, help all 3 audiences, plain English?
cat CHANGELOG.md   # Entry exists, matches README narrative
cat CLAUDE.md      # Bi-synced with project.faf
cat project.faf    # Version, state, metadata current
```

**Cross-check:**
- [ ] README **HTML header** — version + edition name updated
- [ ] README **body** — edition-explainer section present and accurate
- [ ] README ↔ CHANGELOG — same narrative, same numbers, same edition name
- [ ] CLAUDE.md — bi-synced with project.faf
- [ ] project.faf — version, state, metadata current
- [ ] **Brand voice** — quality bar met; not generic feature copy

**If the quality bar isn't met, iterate on the copy NOW — before proceeding to Step 2. Iteration to land copy properly IS the gate working, not friction.** When wolfejam gives exact wording, preserve it verbatim — paraphrasing to "tighten" can break grammar even when words look interchangeable. See `memory/doc-gate-quality-bar-not-yn-check.md` for the full doctrine and the "how to apply" rules.

### Step 1.5b: Docs-Site Gate (after the CHANGELOG — update docs.faf.one if the release changed anything it documents)

*Codified 2026-09-02 (wolfejam): "update docs.faf.one as part of the routine, after changelog — update the docs if necessary" → "docs need to start covering faf-cli AND other areas of faf — the format, the MCP servers, the SDKs, general knowledge, the other apps."*

The repo README/CHANGELOG is a *release* surface; **`docs.faf.one` is THE manual for the whole FAF surface** — and it drifts silently because no gate touches it. It is **not** faf-cli-only: it is the single home that should grow to cover the format (`.faf` / `.fafm` / `.fafa`), the CLI, the MCP servers, the SDKs, the concepts, and the ecosystem apps. Today it mostly covers faf-cli; every ship is a chance to close that gap for the thing being shipped.

**One site, one repo:** `~/FAF/faf-docs-site` (`Wolfe-Jam/faf-docs-site`, VitePress) → **docs.faf.one**, Cloudflare Pages, **auto on push to `main`**. A separate repo from any package — its push is not the package release.

**Procedure — EVERY package, after the CHANGELOG entry (Step 1.5):**

1. **Read the CHANGELOG entry you just wrote.** Then two questions:
   - **(a) Does the manual already cover this package/area?** Check `docs/*.md` + `.vitepress/config.*` sidebar. If there is **no section for this package at all** (e.g. a first `claude-faf-mcp` ship, an SDK, the format spec) → that is a **gap**: log it (memory / `docs/` TODO) and, if the release is a natural moment (new package, headline capability), **add at least a stub section** — don't leave the manual pretending FAF is just a CLI.
   - **(b) Does THIS release change a documented command / flag / behavior / concept?**
     - **NO** (internal accuracy, perf, bug fixes that don't move the documented surface) → note *"docs-site: no change needed — <why>"* and proceed. Version-agnostic pages are a feature.
     - **YES** → step 2.
2. `cd ~/FAF/faf-docs-site` → edit the affected page(s) under `docs/*.md`; add a page + sidebar entry in `.vitepress/config.*` for new areas.
3. Edit the minimum. Match the site's voice: terse, "facts for devs", **no version numbers, no changelog** — it documents *behavior*, not releases. A great entry point (e.g. `faf git <url>`) earns a section even when the CHANGELOG framed it as an improvement.
4. `bun run docs:build` to confirm it compiles → commit + `git push origin main` → **Cloudflare auto-deploys**.
5. Record in the approval table: **`Docs site` — ✅ updated (`<pages>`, `<sha>`) / ✅ no change needed (`<why>`) / ⚠ gap logged (`<area>` not yet covered)**.

**Not a hard publish gate** (a stale manual sentence won't red the npm badge) — but it IS a required checkpoint. Docs drift + "the manual thinks FAF is only a CLI" are the slow leaks this step exists to stop. The approval table carries the `Docs site` row **every** release, `faf-cli` or not.

### Step 1.55: Edition Name + Version Description (every minor/feature release gets BOTH)

*Codified 2026-06-07 (gemini-faf-mcp 2.4.0 "The Chameleon Edition").* A FAF release isn't ready until it has **two paired, confirmed artifacts** — they are written ONCE here and reused verbatim everywhere downstream:

**Artifact 1 — the Edition Name** (the metaphor): an Edition that **describes what the version actually does** — the headline capability becomes the name. The name is the story; the changelog is the proof.
- **Derive from the feature, never generic.** "The Chameleon Edition" because the binary reads its environment and adapts its transport. ❌ BANNED: "Special-Edition," "The Update Edition," any name that would fit any release. If the name doesn't point at *this* version's headline, it's wrong.
- **Scope = minor, not patch** (per `memory/editions-tied-to-minor-not-patch.md`). New minor → new Edition; patches inherit the minor's; major = always.

**Artifact 2 — the Version Description** (the one-liner): the **"describe this version as concisely as possible"** sentence — plain, falsifiable, brand-voice. Example (2.4.0): *"One command, both modes — gemini-faf-mcp auto-selects its transport: stdio locally, Streamable HTTP on Cloud Run. Same binary, 12 tools, zero config."* Plus a tighter one-liner where it helps (*"One binary that's a local MCP server and a hosted one, decided by its environment."*). This is NOT the Edition name and NOT the feature bullets — it's the headline sentence a human reads first.

**Both:**
- **Propose, recommend one, and CONFIRM with wolfejam** — name + description are brand voice, his call (he may hand you either).
- **Flow VERBATIM to every surface** — Edition name → CHANGELOG entry header (`## [X.Y.Z] - DATE — The <Name> Edition`), README "What's New" header, GitHub release title (Step 9). Version description → CHANGELOG lead paragraph, README "What's New" lead, GitHub release-notes lead, and any blog/social. Doc Gate consistency applies to BOTH — same name, same description, everywhere.

A release with no Edition, a generic Edition, or no concise description is not ready to ship. This is a quality gate, not decoration.

#### Step 1.55-MCP — Surface map (MCP servers only — MANDATORY when profile = MCP)

*Codified 2026-08-06 after CFM compose-floor ship prep: Edition/oneliner are Doc Gate fields, but agents only stamped version into server.json and skipped §1.55 for MCP.*

**Lock Edition + Oneliner once (§1.55), then stamp:**

| Surface | Version | Edition name | Oneliner (short description) |
|---------|---------|--------------|------------------------------|
| `package.json` | ✅ | — | product `description` (stable OK) |
| CHANGELOG entry | ✅ | ✅ header | ✅ lead paragraph |
| README What's New / H1 | ✅ | ✅ | ✅ lead |
| GitHub Release | ✅ tag | ✅ title | ✅ notes lead |
| `server.json` | ✅ | product `title` only (e.g. Claude FAF) | product `description` **preserved** by emitter — not auto-edition |
| `manifest.json` | ✅ before mcpb | — | product blurb |
| MCP Registry live | ✅ | display title from card | registry description |

**Refuse if:** minor/feature release has no confirmed Edition + Oneliner, or they differ between CHANGELOG and README.  
**Do not refuse if:** `server.json.description` ≠ oneliner (by design unless you change `gen-server-card.js`).

**Compose-floor claim (when release bumps `faf-cli`):** CHANGELOG must state the pin (`faf-cli ^X.Y.Z`) and point at a **re-runnable** test (e.g. CFM `tests/wjttc-edition-compose.test.ts`). Sibling MCPs: same compose playbook — do not fork language detectors (`docs/compose-faf-cli.md` on CFM is the precedent).

### Step 1.6: Tool-Count Consistency + Headline Reachability Gate (MCP servers — MANDATORY)

*Codified 2026-06-07; **reachability added 2026-06-25.*** If the package is an MCP server, TWO things must hold before publish:

1. **Count consistency** — the advertised **tool count must agree across SOURCE, RUNTIME, and DOCS** (a number users read and trust).
2. **Headline reachability** — if the release's edition/headline names a tool or a flag (e.g. *"`faf_sync` gains a `copilot` flag"*), that capability **must be invocable from the DEFAULT `tools/list`** — the surface a fresh user gets with NO env flags. Not merely *present in source*; not gated behind `FAF_TOOLS=all` / `FAF_MCP_SHOW_ADVANCED` / any opt-in. **Count-consistency is NOT feature-reachability** — verify BOTH. Refuse on either mismatch.

```bash
# 1. SOURCE — count tool registrations (adapt the pattern to the framework):
#    Python/FastMCP: @mcp.tool   TS: server.tool( / registerTool( / static listTools array   Rust: .tool(
grep -cE "@mcp\.tool|server\.tool\(|registerTool\(|\.tool\(" server.py src/**/*.ts 2>/dev/null

# 2. RUNTIME — live tools/list on the actual server(s) (local OR deployed + behind any edge):
curl -s -X POST "<endpoint>" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | python3 -c "import sys,json,re; raw=sys.stdin.read(); m=re.search(r'data:\s*(\{.*\})',raw); print(len(json.loads(m.group(1) if m else raw)['result']['tools']))"

# 3. DOCS — every place that claims a count:
grep -rnE "[0-9]+ tools|[0-9]+ MCP [Tt]ools|tools_count|\([0-9]+ tools" README.md CHANGELOG.md CLAUDE.md server.json *.json

# 4. REACHABILITY — probe the DEFAULT surface (NO env flags) and confirm the headline
#    capability is actually there. A server may curate its default tools/list to a subset;
#    a headline tool hidden in the Extended/all-only set ships a claim a default user can't use.
#    (TS example — adapt the handler import to the repo; for a built dist use dist/.../tools.js)
node -e "const{FafToolHandler}=require('./dist/src/handlers/tools.js');new FafToolHandler().listTools().then(r=>{const t=(r.tools||r);const n=t.map(x=>x.name);console.log('default tools/list count:',n.length);console.log('headline tool present:',n.includes('<HEADLINE_TOOL>'));const h=t.find(x=>x.name==='<HEADLINE_TOOL>');console.log('headline flag present:',h?Object.keys(h.inputSchema.properties||{}).includes('<HEADLINE_FLAG>'):false);})"
#    → headline tool present:true AND (if a flag) headline flag present:true. Anything false = BLOCK.
```

**Pass = (a) SOURCE count == every RUNTIME count == every DOCS claim, AND (b) the headline tool/flag is present in the DEFAULT `tools/list`.** A wrong count is a trust leak that ships permanently in the README; a headline feature reachable only via an env flag is an over-claim (the user reads "Claude does X" and a default install can't). Fix the doc, the server, or the default-surface curation before publishing — never write an unverified "it's reachable" into the approval table.

**CFM defaults (as of 2026-08 — keep docs honest):**
- **Default Core = 12** (`faf_init` · `faf_auto` · `faf_go` · `faf_bench` · `faf_score` · `faf_doctor` · `faf_sync` · `faf_context` · `faf_trust` · `faf_about` · `faf_etch` · `faf_recall`). **No `faf_enhance`** (removed — silent DNA rewrite).
- **Extended** via `FAF_TOOLS=all` (~34 tools). Docs must not say “Core 13” or claim enhance.
- **Composition headline** (“inherits faf-cli Edition rail”): not a new tool — prove via Core **`faf_auto`** (default surface) + permanent suite `tests/wjttc-edition-compose.test.ts` (also exercises `faf_formats` under `FAF_TOOLS=all`). Do not claim a new Core tool for language Editions.

- Receipt (count): gemini-faf-mcp 2.4.0 — 12 = 12 (prod) = 12 (edge) = every doc.
- Receipt (reachability): claude-faf-mcp **5.14.0 shipped the gap** — Copilot flag only on non-Core `faf_bi_sync`; **5.14.1** fixed. See memory `feedback-headline-feature-must-be-default-reachable.md`.

### Step 1.7: MCPB SHA Gate (MCP servers with an `mcpb` registry block — MANDATORY, NO-PUBLISH)

*Codified 2026-06-12 (claude-faf-mcp 5.9.0). wolfejam: "the SHA must be real, server.json must be verified. No-publish gate."*

If `server.json` carries an `mcpb` package block, its `fileSha256` MUST be the **real sha256 of the built `.mcpb`**, mechanically **verified to match the artifact byte-for-byte**. A `TBD`/placeholder, a stale prior-version sha, or a mismatch = **BLOCKED. Do not publish.** A committed placeholder is the same wrong-but-green incoherent stamp Doc Gate 101 exists to kill — and the MCP Registry rejects (or mis-points) an asset whose sha doesn't match.

**Build once → sha once → upload THAT file.** A `.mcpb` is a ZIP; its sha depends on the exact bytes built (timestamps included). Rebuilding between sha and upload drifts the sha. So build the artifact here, sha it INTO `server.json`, and attach **that exact file** to the GitHub release (Step 9) — never rebuild in between.

```bash
# 0. BUMP manifest.json version FIRST — it does NOT ride `npm version`, so it goes
#    stale and bakes the WRONG version INTO the bundle (bit claude-faf-mcp 5.9.1).
node -e "const fs=require('fs'),m=require('./manifest.json');m.version=require('./package.json').version;fs.writeFileSync('./manifest.json',JSON.stringify(m,null,2)+'\n')" 2>/dev/null || true

# 1. Build the canonical .mcpb (the artifact that ships):
npm run pack:mcpb                     # → <pkg>-<ver>.mcpb (adapt to repo's pack script)

# 2. Compute its real sha256 and write it into server.json's mcpb block:
VER=$(node -e "console.log(require('./package.json').version)")
PKG=$(node -e "console.log(require('./package.json').name)")
MCPB=$(ls "${PKG}-${VER}.mcpb" "../${PKG}-${VER}.mcpb" 2>/dev/null | head -1)
ART=$(shasum -a 256 "$MCPB" | awk '{print $1}')
#   (edit server.json fileSha256 = $ART; also confirm the mcpb identifier URL + every version stamp = $VER)

# 3. GATE — verify, refuse on mismatch:
SJ=$(grep -oE '"fileSha256": "[a-f0-9]{64}"' server.json | grep -oE '[a-f0-9]{64}')
if [ -n "$SJ" ] && [ "$SJ" = "$ART" ]; then
  echo "✅ MCPB SHA Gate: real + verified (matches ${MCPB})"
else
  echo "🚫 MCPB SHA Gate BLOCK — fileSha256 placeholder/stale/mismatch. NO PUBLISH."; exit 1
fi
```

**Pass = `server.json` fileSha256 is a real 64-hex sha that matches the built `.mcpb`, and the mcpb URL + version stamps are the release version.** Anything less blocks the publish. Doctrine: memory `gate-mcpb-server-json-sha-verified.md` · `feedback-publish-only-via-pub-skill.md`.

### Step 2: 🚨 MANDATORY Dry-Run Check

**NEVER SKIP THIS STEP - It's what the user relies on most**

```bash
# For npm packages:
echo "=== DRY RUN PUBLISH CHECK ==="
npm publish --dry-run 2>&1 | tee /tmp/dry-run-output.txt

# For mcpaas-cf (Cloudflare Workers) — run on the release PR branch (auto-deploys on merge):
echo "=== DRY RUN DEPLOY CHECK ==="
npx wrangler@4 deploy --dry-run --outdir /tmp/mcpaas-dry 2>&1 | tee /tmp/dry-run-output.txt   # read Total Upload / gzip
```

**STOP and review the output with the user:**
- Files being included
- Package size
- Any warnings or errors
- Missing or unexpected files

**Present the output to the user and explicitly ask:**
"The dry-run output is above. Does this look correct? Should I proceed with the checklist?"

**DO NOT CONTINUE without user confirmation.**

### Step 3: Run Build & Tests

**For ALL packages:**
```bash
npm run build
npm test
```

**Additional for faf-cli** (`build:verify` and `version:truth` no longer exist; retired before 8.2.1):
```bash
npm run check:engines        # Node floor == lowest Node in CI
npm run check:no-hardcode
npm run lint                 # 0 errors (warnings are known)
```
**Run `npm test` AFTER the version bump**, not before: faf-cli has a test that the plugin manifest carries the package version (8.2.1's first PR run went red on exactly that).

#### Step 3b: Count Stamp — the last green run IS the number (MANDATORY)

A test count in the docs is only true if it came from the run that just passed. After `npm test` is green (**N passed, 0 failed**):

1. **Stamp N** into every live count claim: the README test badge and the "N tests" in What's New and in THIS version's CHANGELOG entry. The next release's green run replaces it (265/0 → 270/0 → …).
2. **Refuse** if any other live claim carries a different test count — stamp it or delete it:
   ```bash
   grep -rnoE 'Tests-[0-9]+|[0-9]+ (tests|passing)' README.md project.faf AGENTS.md CLAUDE.md 2>/dev/null
   ```
3. **Requirements carry no numbers.** Guardrails, Definition of Done, and project.faf warnings say "the full test suite passes", never "must pass N tests".
4. **If a number can't be stamped reliably** (free text the gate can't reach), **remove it.** No number beats a stale number.

History keeps its numbers: older CHANGELOG entries are dated records and are never re-stamped. This is the test-count sibling of Step 1.6's tool-count gate.

> **Receipt (gemini-faf-mcp 2.8.2, 2026-09-11):** project.faf said "must pass 245 tests" while the suite was 265/0, and it was copied into AGENTS.md. wolfejam: *"if the next one is 270/0 that's the new one, if that itself is unreliable dont use any numbers."*

### Step 4: Verify ALL Files (CRITICAL)

**Run these checks - DO NOT SKIP:**

```bash
# Current version
cat package.json | grep '"version"' | head -1

# Previous version (for bump reporting)
git log --oneline -10  # Find previous version commit

# CHANGELOG - MUST have entry for current version
head -30 CHANGELOG.md

# README - check header/version references
head -50 README.md

# CLAUDE.md - verify current
head -30 CLAUDE.md

# Git status - must be clean
git status --short
```

**Verification Checklist:**
- [ ] Build clean (no errors)
- [ ] Tests passing (note count: X/X)
- [ ] Version bumped correctly (from X.X.X to X.X.X)
- [ ] **CHANGELOG.md has entry for current version** (if missing, ADD IT)
- [ ] README current (update if new features)
- [ ] CLAUDE.md current
- [ ] Git clean (if not, commit pending changes first)

**If CHANGELOG is missing entries:** Update it with changes from `git log` before proceeding.

### Step 4.5: 🚨 MANDATORY Commit + Push BEFORE Approval

**The user reviews on GitHub, NOT in your local file claims.** The approval table is meaningless without the GitHub-rendered state visible. Commit and push every staged change to `origin/main` BEFORE generating the approval table — this gives wolfejam the actual rendered README, CHANGELOG, CONTRIBUTING.md, tier tables, file presence, etc. to inspect on the public repo page.

**Why this is non-negotiable:**

- Local file inspection (`grep`, `cat`, line-number quotes) creates a trust gap. wolfejam cannot independently verify "the heart row is on line 123" without seeing the rendered table on GitHub.
- "Review then commit" inverts the trust model — you're asking the user to trust your claims about state that doesn't exist in the public repo yet.
- Reverting a pre-publish push is cheap (one revert commit). Recovering from a permanent npm publish based on uninspected state is impossible.
- Locked 2026-04-29 during grok-faf-mcp v1.2.2 — wolfejam: "update the pubpro it is 100% commit + push, its how I check the README/Repo"

**The flow:**

```bash
# Stage by name — never `git add -A` (can include sensitive files)
git add <file1> <file2> <file3> ...

# Show staged + unstaged for sanity
git status --short

# Commit with a tight message
git commit -m "<focused commit subject>

<body explaining why, not just what>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

# Push to origin
git push origin main
```

**After push, present to wolfejam:**

> Pushed `<sha>` to origin/main. Verify on GitHub before approval:
> **https://github.com/Wolfe-Jam/<repo>**
>
> Things to confirm visually:
> - <specific README sections that changed>
> - <specific files that were added/removed>
> - <specific tables, code snippets, brand-marks where rendering matters>
>
> Reply GO! once verified. If anything's wrong, point at it and I'll fix before the npm/PyPI publish.

**Only after wolfejam confirms visual verification on GitHub do you proceed to Step 5 (Approval Request) and Step 6 (Wait for GO!).**

The npm/PyPI publish is the irreversible gate; the git push is a reversible step that exists specifically to enable inspection.

### Step 5: Generate Approval Request

Format the results as a table:

```
## <package-name> v<version> Ready for Publish

| Check | Status |
|-------|--------|
| **CI/CD** | ✅ Green — all jobs passing |
| **🚨 Dry-Run** | ✅ Reviewed |
| **Build** | ✅ Clean |
| **Tests** | ✅ X/X passing |
| **Version** | ✅ X.X.X (from X.X.X) |
| **CHANGELOG** | ✅ Updated (entry for vX.X.X) |
| **README** | ✅ Current |
| **package.json** | ✅ Version correct |
| **CLAUDE.md** | ✅ Current |
| **Docs site** | ✅ updated (`<pages>`, `<sha>`) — OR — ✅ no change needed (`<why>`) |
| **Git** | ✅ **Committed + pushed to origin/main** (`<sha>`) — verify on github.com/Wolfe-Jam/<repo> |
| **GitHub visual review** | ⏳ Awaiting wolfejam confirmation on rendered repo state |

**Changes in vX.X.X:**
- <bullet points of what changed>

---

Awaiting GO! from wolfejam
```

### Step 6: Wait for Approval

**DO NOT PUBLISH** until wolfejam responds with:
- "GO!"
- "GREEN LIGHT"

Any other response = DO NOT PUBLISH

### Step 6.5: 🚨 FINAL Dry-Run (MANDATORY if any commits landed after Step 2)

**Dry-run has saved the show many times. Never skip because CI is green or an earlier dry-run passed.**

If ANY commit has landed between Step 2 and Step 7 — even a documentation-only one, even a workflow rename, even a single-character README tweak — the tarball has changed. Re-run dry-run and show the user the diff before `npm publish`.

```bash
# For npm packages — re-run against the current HEAD
npm publish --dry-run 2>&1 | tee /tmp/dry-run-final.txt
```

**Compare to the Step 2 dry-run:**
- Has `package size` changed?
- Has any file size changed (especially README.md)?
- Are there any new warnings?
- Is the file list identical?

**Why this matters:** CI inspects code. Dry-run inspects the actual tarball — the thing users download. README edits, .npmignore changes, accidentally-included files show up in dry-run only. The final dry-run catches the "wait, was this what I meant to ship?" moment that CI cannot.

**Present to user:**
- If identical to Step 2 dry-run → "Tarball unchanged from approval. Proceeding to publish."
- If different → Show the diff (sizes, file list) and ask: "These changes landed after the approval. Proceed with publish?"

**DO NOT PUBLISH without this final check if any post-Step-2 commit exists.**

### Step 6.75: 🚨 npm whoami Gate + User-Terminal Handoff (LOCAL npm packages)

*Codified 2026-08-11 after claude-faf-mcp 5.21.0: agent session had E401 on `npm whoami` while wolfejam's own terminal was already `wolfejam.dev` with hundreds of prior uploads. Agents over-prescribed `npm config set …_authToken` recovery and burned turns. The fix is a gate + a short handoff — not a token tutorial.*

**Applies to:** every package that publishes with **local** `npm publish` (faf-cli · claude-faf-mcp · faf-mcp · grok-faf-mcp · slash · bun). **Skip for:** gemini/PyPI (OIDC tag) · mcpaas (wrangler).

**Run immediately before Step 7 (after GO + final dry-run):**

```bash
bash ~/.claude/skills/pubpro/scripts/npm-whoami-gate.sh
# exit 0 = wolfejam.dev. exit 1 = NOTICE (terminal + macOS banner). Never retry OIDC.
```

| Result | Action |
|--------|--------|
| `wolfejam.dev` | Proceed to Step 7 in this session |
| Other identity / empty / E401 | **NOTICE + STOP.** Do **not** invent token/`npm config set` paths. Do **not** re-dispatch `publish-npm.yml`. |

**Handoff when agent auth is dead (user terminal is fine):**

1. State clearly: *gates are green; only npm write needs your terminal (agent whoami failed).*
2. Give **only** these commands (no config lecture, no Automation-token essay):

```bash
cd <package-path>
npm whoami                    # expect: wolfejam.dev
npm publish
npm view <pkg> version        # expect: <VERSION>
# then: "npm live — resume release"  → agent continues Step 9 (GH release + mcpb) → 8/9.5/10
```

3. Agent **must not** cut the `v*` tag / GH Release until `npm view` shows the new version (atomicity).
4. When user pastes `+ pkg@ver` / says resume: run Step 9 → registry auto → truth-table. Do **not** re-run Doc Gate from scratch.

**Banned in handoff copy (unless user explicitly asks how to repair a dead machine auth):**
- Leading with `npm config set //registry.npmjs.org/:_authToken=…`
- Multi-path “A/B/C recovery” essays when the human has hundreds of successful publishes
- Blaming Cloudflare / wrangler for an npm E401

**Account fact:** FAF npm maintainer is **`wolfejam.dev`** (not `wolfejam`). See memory `npm-publish-account-and-2fa-lockout.md` only if *their* whoami is also dead.

### Step 7: Post-Publish (After Approval)

**For npm packages** (only after Step 6.75 passes in *this* shell, or user confirmed npm live via handoff):
```bash
npm publish
npm view <pkg> version   # must match manifest before Step 9
```

**For gemini-faf-mcp (PyPI):**
```bash
# Uses Trusted Publisher (OIDC) - no token needed
git tag v<VERSION>
git push origin v<VERSION>
# GitHub Actions will publish via pyproject.toml
```

**For bun-sticky (npm, Bun-native — LOCAL publish):**
```bash
# bun-sticky publishes LOCALLY (like faf-cli) — no CI publish (release.yml removed
# 2026-07-08 per "CI validates, pubpro publishes — never both"). Authed as wolfejam.dev.
npm publish                                       # from /Users/wolfejam/FAF/bun-sticky-faf
npm view bun-sticky version                       # confirm <VERSION> is live
git tag v<VERSION> && git push origin v<VERSION>  # release marker (then cut the GH release, Step 9)
# GOTCHA (2026-07-08): a `uchg` immutable flag on ~/.npmrc throws EPERM/ENEEDAUTH on publish —
#    clear it (`chflags nouchg ~/.npmrc`) if auth fails despite `npm whoami` looking fine.
```

**For mcpaas-cf (Cloudflare Workers) — auto-deploys on merge:**
Do **not** run `wrangler deploy` by hand. The release PR (all gates + approval table, § Auto-deploy repos) is merged by wolfejam; `.github/workflows/deploy.yml` deploys it. Watch it, then run Step 7.5:
```bash
cd /Users/wolfejam/FAF/mcpaas-cf
gh run list --workflow "Deploy to Cloudflare Workers" --limit 1   # must be success on the merge commit
# Fallback only if the workflow didn't run: gh workflow run deploy.yml  (never a local wrangler deploy from a dirty tree)
```

**For faf-cli ONLY — Step 7a: Dual-publish to `faf` (MANDATORY — locked doctrine):**

`faf-cli` is published to **two** npm package names — `faf-cli` (canonical, deterministic, CI/test-safe) and `faf` (the UX users actually type via `bunx faf` / `npx faf`). Every release of `faf-cli` MUST republish to `faf` so `bunx faf` doesn't drift. **One bumps, both ship.** Without this step, users running `bunx faf` get an older version's output and downstream tests (e.g. `faf-agent`) fail mysteriously.

```bash
# After `npm publish` for faf-cli succeeds:
cd /Users/wolfejam/FAF/cli

# Option A — same tarball, different name (simplest):
# Temporarily rename the package, republish, restore.
node -e "let p=require('./package.json'); p.name='faf'; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n')"
npm publish
node -e "let p=require('./package.json'); p.name='faf-cli'; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n')"

# Verify both versions on npm match:
npm view faf version       # should match faf-cli's just-published version
npm view faf-cli version
```

**Verify:** the `faf` and `faf-cli` versions on npm should match after this step. If they diverge again, drift recurs.

**Doctrine:** memory `npm-faf-vs-faf-cli-name-strategy.md`. Caught live 2026-05-07 in `faf-agent/tests/test_project_faf_score.py` — assertions failed because `bunx faf` returned old v4.0.0 output. Dual-publish discipline closes this permanently.

**Future:** when faf-cli has the bandwidth, convert `faf` to a thin proxy package (`faf/package.json` with `dependencies: { "faf-cli": "latest" }` + a one-line bin that re-execs `faf-cli`). That removes the need for the temp-rename dance.

---

**For faf-cli ONLY — Step 7b: VERIFY Homebrew auto-update (after Step 7a):**

**DO NOT hand-edit the local tap clone.** The tag push (Step 9) triggers
`homebrew.yml` → `update-formula.yml` in `Wolfe-Jam/homebrew-faf`, which
bumps the formula **server-side, on the tap repo itself**. This is the
authoritative path and it runs on every `v*` tag.

The old manual flow (clone-edit-commit-push from
`/usr/local/Homebrew/Library/Taps/wolfe-jam/homebrew-faf`) is **retired**.
That local clone is a developer checkout that drifts (detached HEAD,
abandoned rebases) — touching it for releases was the entire source of
recurring Homebrew pain. The automation never needed it.

Verify-only — after the tag is pushed (Step 9):

```bash
# 1. CI Homebrew workflow went green for this tag
gh run list --repo Wolfe-Jam/faf-cli --workflow "Update Homebrew" \
  --limit 1 --json conclusion,headSha \
  --jq '.[0] | "\(.conclusion)  \(.headSha[0:9])"'

# 2. Tap formula now points at the new version (source of truth = remote)
gh api repos/Wolfe-Jam/homebrew-faf/contents/Formula/faf-cli.rb \
  --jq '.content' | base64 -d | grep -E 'url |sha256 '
```

**Pass:** workflow `success` AND formula URL shows `faf-cli-<VERSION>.tgz`.
**If the workflow is red or the formula is stale:** the fix is in
`homebrew.yml` / the tap's `update-formula.yml` — NOT a local hand-edit.
Flag it; do not paper over with a manual push from the drifting clone.

### Step 7.5: Post-Deploy Verification (For Live Services)

**Skip if:** Package is a CLI tool or library with no live deployment.

**Applies to:** mcpaas-cf (mcpaas.live), mcpaas-beacon, or any package that deploys to a live endpoint.

After publish/deploy, run the post-deploy WJTTC test suite to verify the live service:

```bash
# MCPaaS (mcpaas.live) — deployed by the merge (deploy.yml), not by hand
cd /Users/wolfejam/FAF/mcpaas-cf
curl -s https://mcpaas.live/health           # version = the release; scoring = faf-kernel (always-33)
npx vitest run tests/wjttc/post-deploy.test.ts
```

**What it checks:**
- Health, security headers, CORS (TIER 1 BRAKE)
- All pages, souls, MCP protocol, API, well-known endpoints (TIER 2 ENGINE)
- Canonical headers, caching, badges, manifest (TIER 3 AERO)

**Pass criteria:** All tests pass. Report auto-generated at `reports/post-deploy-latest.md`.

**If tests fail:** Do NOT proceed to Step 8. Fix and redeploy first.

### Step 8: MCP Registry Publish (For MCP Servers — namespace-aware)

**⚠️ ORDER (permanent, since the one.faf migration — claude-faf-mcp 5.9.1):** for any server with an `mcpb` package, the **GitHub release + `.mcpb` (Step 9) must ALREADY exist** — the registry validates the mcpb URL is publicly downloadable (HTTP 200). So the real order is **npm (Step 7) → GitHub release + mcpb (Step 9) → registry (this step)**. The pre-flight below refuses if the mcpb isn't live yet.

**⚡ AUTO-PUBLISH PRE-CHECK (do this FIRST) — skip the manual publish if CI does it.** If the repo has a release-triggered DNS workflow (`.github/workflows/*registry*publish*.yml` using `mcp-publisher login dns`) AND the `FAF_ONE_MCP_PRIVATE_KEY` repo secret is set, the **registry publish is AUTOMATED on `release: published`** — the GitHub release (Step 9) fires it. **Do NOT also run the manual 8b/8d** — a second publish of the same version hits `400 cannot publish duplicate version`, and if that's the workflow it **REDS the release badge** (the thing Step 9.5 exists to prevent). For these repos: cut the release (Step 9) → let the workflow publish → verify via **8e** once the Step 9.5 release-CI is green. Detect with:
```bash
gh secret list --repo <owner/repo> | grep -q FAF_ONE_MCP_PRIVATE_KEY && ls .github/workflows/ | grep -qi registry && echo "AUTO — skip manual 8b/8d" || echo "MANUAL — run 8b–8d"
```
- **claude-faf-mcp: AUTOMATED as of 2026-06-22** (secret + `mcp-registry-publish.yml` DNS workflow) → skip manual 8b/8d.
- Other migrated `one.faf/*` servers: still MANUAL until they adopt the same workflow + secret.

**Prerequisite (manual path only):** `brew install mcp-publisher`

**8a — Registry pre-flight (the dry-run `mcp-publisher` doesn't give you).** Catches the namespace/ownership/mcpb-404/remote-conflict 400s LOCALLY, before the irreversible publish (the claude pilot hit 3 of these one at a time):
```bash
~/.claude/skills/pubpro/scripts/registry-preflight.sh .
# 🚫 anything → fix first. Common: "publish npm first" (Step 7) · "mcpb 404" (cut the Step 9 release first).
```

**8b — Authenticate (branch on the `server.json` name namespace):**

⚠️ **Before the first login in any repo, confirm `.gitignore` has
`.mcpregistry_*`.** `mcp-publisher login` (either path) drops real OAuth
credential files at the repo root (`.mcpregistry_github_token`,
`.mcpregistry_registry_token`) — nothing in this skill ever wrote them
to `.gitignore` for you, so six FAF repos each independently
rediscovered and hand-patched this the first time someone ran login
locally, silently, with zero record until `mcp-context-card` (2026-09-05)
finally traced it back here. Check first:
```bash
grep -q "mcpregistry" .gitignore 2>/dev/null || echo ".mcpregistry_*" >> .gitignore
```
Then authenticate:
```bash
NS=$(node -p "require('./server.json').name.split('/')[0]")
if [ "$NS" = "one.faf" ]; then
  # DNS-verified namespace — GitHub OIDC/login CANNOT authorise one.faf/*
  PRIVATE_KEY="$(openssl pkey -in ~/FAF-GOLD/mcp-keys/faf-one-mcp.pem -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"
  mcp-publisher login dns --domain faf.one --private-key "$PRIVATE_KEY"
else
  mcp-publisher login github          # legacy io.github.* — device flow
fi
```

**8c — `server.json` version** must already match npm/PyPI + the release tag (Doc Gate 101 + the pre-flight cover this).

**8d — Publish:**
```bash
mcp-publisher publish server.json
```

**8e — Round-trip verify** (the new entry actually serves FAF context — the real Gate-1 proof).

Hits the **authoritative version-detail endpoint** for the EXACT version just published — not the fuzzy `?search=` list (which caps at `limit=60`, can hide the entry behind pagination, and doesn't pin the version). **Nesting matters:** the `ServerResponse` schema is `{ server: ServerJSON{ _meta }, _meta: ResponseMeta }` — publisher-provided lives in **`server._meta`** (the ServerJSON object); the top-level `_meta` is registry-managed (`…/official`) ONLY. Read the wrong box and a *present* receipt looks missing (this exact misread cost a session — see memory `gotcha-publisher-provided-meta-in-server-meta`). Retries briefly to tolerate post-publish propagation lag.
```bash
ENC=$(node -p "encodeURIComponent(require('./server.json').name)")
VER=$(node -p "require('./server.json').version")
for i in 1 2 3; do
  OUT=$(curl -s "https://registry.modelcontextprotocol.io/v0.1/servers/${ENC}/versions/${VER}" \
   | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('lag'); sys.exit()
srv=d.get('server',{})                                            # ServerJSON — publisher-provided _meta is HERE
pp=srv.get('_meta',{}).get('io.modelcontextprotocol.registry/publisher-provided',{})  # NOT d['_meta'] (that's registry 'official')
print('ok' if pp.get('one.faf/context') else 'no-ctx', srv.get('version') or '')")
  case "$OUT" in
    ok\ *)     echo "✅ serves one.faf/context — $OUT"; break;;
    no-ctx\ *) echo "⚠️ published but no one.faf/context in server._meta — $OUT"; break;;
    *)         [ "$i" = 3 ] && echo "⚠️ detail endpoint not consistent yet (propagation lag) — re-check manually" || sleep 4;;
  esac
done
```

**Note (one.faf migration — auto-publish status):** GitHub-OIDC only authorises `io.github.<owner>/*`, never `one.faf` — so the registry publish needs **DNS auth**. A repo can now auto-publish on release via a `login dns` workflow + the `FAF_ONE_MCP_PRIVATE_KEY` repo secret (the ed25519 64-hex private key; its public half is the `v=MCPv1; k=ed25519; p=...` TXT record at the faf.one apex).
- **claude-faf-mcp: auto-publish RESTORED 2026-06-22** — its `mcp-registry-publish.yml` (DNS, release-triggered, with an mcpb-asset HTTP-200 wait) publishes automatically. The AUTO-PUBLISH PRE-CHECK at the top of Step 8 skips the manual step for it.
- Servers WITHOUT the workflow+secret still use the **manual DNS step (8b–8d)**.
- **To restore for another server:** `gh secret set FAF_ONE_MCP_PRIVATE_KEY --repo <owner/repo>` (key extracted from `~/FAF-GOLD/mcp-keys/faf-one-mcp.pem`) + copy the DNS workflow. Reference template: `~/FAF/faf-mcp-rig/.github/workflows/mcp-registry-publish.yml`.

**All 5 FAF MCPs use Ecosystem: #2759 in description**

### Step 8.5: VERIFY Smithery serves the new npm version

**DO NOT run an interactive `npx @smithery/cli publish` every release.**
The Smithery listing's `startCommand` resolves `npx -y <pkg>@latest`, so
the moment npm publishes a new version, Smithery auto-serves it. No
publish call required for version updates. That manual interactive step
is the same band-aid pattern Step 7b had for Homebrew — kept "for
completeness" while the automation already did the work.

Verify-only — after npm publish (Step 7):

```bash
# 1. Smithery listing exists and is reachable
curl -sI -o /dev/null -w "HTTP %{http_code}\n" \
  "https://smithery.ai/server/@wolfe-jam/<pkg>"

# 2. (Optional) Confirm metadata via Smithery API
curl -s "https://registry.smithery.ai/servers/@wolfe-jam/<pkg>" | head -c 400
```

**Pass:** HTTP 200/308 (308 is canonical-URL redirect, not an error) AND
the API returns a record for `wolfe-jam/<pkg>`. The listing serves
`@latest` from npm — no version is pinned on the Smithery side.

**Only re-run `npx @smithery/cli publish` when `smithery.yaml` itself
changed** (description, icon, startCommand) — and ideally automate that
via a `smithery.yml` GitHub workflow on `v*` tags (mirroring
`homebrew.yml`), so even metadata refreshes don't require a manual
interactive step.

**Doctrine:** memory `feedback-refail-means-prior-fix-was-bandaid` —
retire redundant manual steps that fight drifting state. Homebrew Step
7b retirement was the precedent; this is the same fix applied to
Smithery.

### Step 9: Distribution Checklist

After npm/PyPI + MCP Registry, distribute to the full ecosystem.

**Reference:** `/Users/wolfejam/FAF-GOLD/PLANET-FAF/docs/MCP-REGISTRY-LANDSCAPE-2026.md`

#### TIER 1: OFFICIAL / AUTHORITATIVE

| Registry | URL | Notes |
|----------|-----|-------|
| **Official MCP Registry** | registry.modelcontextprotocol.io | THE source. mcp-publisher CLI. |
| **GitHub MCP Registry** | docs.github.com/en/copilot/concepts/context/mcp | Powers VS Code MCP marketplace |

#### TIER 2: MAJOR DIRECTORIES (High Traffic)

| Directory | URL | Size | Submission |
|-----------|-----|------|------------|
| **MCP.so** | mcp.so | 17,387+ | Auto-indexes npm/PyPI |
| **PulseMCP** | pulsemcp.com/servers | 7,890+ | Submit via form |
| **Glama.ai** | glama.ai/mcp/servers | Large | Auto-indexes GitHub |
| **Smithery.ai** | smithery.ai | 1,500+ | Auto-serves `@latest` from npm via `startCommand` — no per-release publish call needed (only when `smithery.yaml` itself changes; see Step 8.5) |

#### TIER 3: CURATED LISTS (GitHub PRs)

| List | URL | Notes |
|------|-----|-------|
| **awesome-mcp-servers** (punkpeye) | github.com/punkpeye/awesome-mcp-servers | Production + experimental |
| **awesome-mcp-servers** (wong2) | github.com/wong2/awesome-mcp-servers | Original curated list |

#### TIER 4: AGGREGATORS / FINDERS

| Site | URL |
|------|-----|
| **MCPMarket.com** | mcpmarket.com |
| **mcp-awesome.com** | mcp-awesome.com |
| **mcpservers.org** | mcpservers.org |
| **mcpserverfinder.com** | mcpserverfinder.com |
| **mcpregistry.online** | mcpregistry.online |

#### TIER 5: IDE-SPECIFIC

| Platform | Notes |
|----------|-------|
| **Cline MCP Marketplace** | GitHub Issue submission |
| **Cursor.directory** | Cursor-specific listing |
| **LobeHub** | MCP server directory |

#### Phased Rollout Plan

| Phase | Timeline | Targets |
|-------|----------|---------|
| Phase 1 | Immediate | Official Registry, GitHub Registry |
| Phase 2 | Week 1 | MCP.so, PulseMCP, Glama, Smithery |
| Phase 3 | Week 2 | awesome-mcp-servers PRs (both repos) |
| Phase 4 | Ongoing | Aggregators, IDE-specific directories |

**GitHub Release (ALL packages):**

Create a GitHub release immediately after `npm publish`.

**⚠️ ORDER for `mcpb` servers (all migrated `one.faf/*`):** cut this release and **attach the built `.mcpb` BEFORE Step 8 (registry publish)** — the registry validates the mcpb URL resolves (HTTP 200). Order: npm (Step 7) → **this release + `.mcpb`** → registry (Step 8). Add the packed file (whose sha is in `server.json`) as a positional arg: `gh release create … <pkg>-<ver>.mcpb`.

```bash
gh release create v<VERSION> \
  --title "v<VERSION> — <Edition Name if applicable>" \
  --notes "<release notes from CHANGELOG>"
```

**Edition detection — if the CHANGELOG entry has a named edition (e.g. "The Relentless Edition", "The Conductor Edition"), include it in the release title:**
- Named edition → `v5.4.0 — The Relentless Edition`
- No edition name → `v5.4.0`

Release notes must include:
- What's new (from CHANGELOG)
- Test count
- "FAF defines. AGENTS.md instructs. AI codes." closing line

### Step 9.5: Post-Release CI Verification (MANDATORY — no red badges on npm)

**Step 1.1 verifies CI before the release. This step verifies the release event itself. The `release:created` event triggers workflows a second time — if any job fails there, the npm badge flips red even though publish succeeded. A red badge on npm is permanent damage; this step exists to catch the failure inside the pubpro flow instead of a user seeing it first.**

**This is the blind spot that caused the v5.5.1 red badge on claude-faf-mcp — pubpro's pre-publish CI gate was green, but the release event fired a CI workflow that failed (CI was trying to double-publish). Fixed in FAF workflows by removing `npm publish` from CI, but the verification step stays as a permanent guard.**

```bash
# Resolve repo from package.json
REPO=$(node -e "const p=require('./package.json'); const u=p.repository?.url||''; const m=u.match(/github\.com[\/:]([^\/]+\/[^\/\.]+)/); console.log(m?m[1]:'unknown')")

# Poll the release-triggered workflow run for up to 3 minutes
for i in $(seq 1 36); do
  STATUS_JSON=$(gh run list --repo "$REPO" --event release --limit 1 --json status,conclusion,databaseId)
  CONCLUSION=$(echo "$STATUS_JSON" | jq -r '.[0].conclusion // ""')
  RUN_STATUS=$(echo "$STATUS_JSON" | jq -r '.[0].status // ""')
  RUN_ID=$(echo "$STATUS_JSON" | jq -r '.[0].databaseId // ""')

  if [ "$CONCLUSION" = "success" ]; then
    echo "✅ Release CI green — npm badge will stay green"
    break
  elif [ "$CONCLUSION" = "failure" ] || [ "$CONCLUSION" = "cancelled" ]; then
    echo "🚫 RELEASE CI FAILED — npm badge is now RED"
    gh run view "$RUN_ID" --repo "$REPO"
    exit 1
  fi
  echo "⏳ Release CI: $RUN_STATUS (attempt $i/36)"
  sleep 5
done
```

**Rules:**
- ✅ Release CI green → proceed to distribution
- ⏳ Release CI in progress → keep waiting up to 3 min
- 🚫 Release CI failed → **STOP. Flag to wolfejam immediately. Do NOT proceed to distribution or social posts.** Fix the CI failure first; red badges on npm are banned.

**If you see `npm publish` sneaking back into any FAF repo's workflow file, open a PR to remove it immediately.** CI validates, pubpro publishes — never both.

### Step 10: ✪ Release Truth-Table Verification (MANDATORY — declares "release is REAL")

**Step 9.5 watches CI. Step 10 watches the release contract.** A release is REAL only when all six surfaces report the same version AND the working tree is clean. Anything less is drift, and drift is "not actually shipped."

The six surfaces:

1. Manifest version (`package.json` or `pyproject.toml`)
2. Latest git tag
3. GitHub Release
4. Registry version (npm or PyPI)
5. MCP Registry version (if applicable)
6. Working tree (must be clean)

**Run the verifier:**

```bash
bash ~/.claude/skills/pubpro/scripts/release-verify.sh
# (auto-detects manifest type, package name, version, MCP applicability)

# Or specify a path:
bash ~/.claude/skills/pubpro/scripts/release-verify.sh /Users/wolfejam/FAF/<package>
```

**Output is a one-shot truth-table:**

```
═══ Release Truth-Table: grok-faf-mcp v1.2.2 ═══

  ✅ Manifest:              1.2.2  (npm: grok-faf-mcp)
  ✅ Latest git tag:        v1.2.2
  ✅ GitHub Release:        v1.2.2  (published 2026-05-03)
  ✅ npm registry:          1.2.2
  ✅ MCP Registry:          1.2.2  (updated 2026-05-01)
  ✅ Working tree:          clean

  ✪ RELEASE COHERENT — ship is REAL
```

**Exit codes:**

- `0` — all dimensions aligned (release is REAL — declare success, post the blog, send the X post)
- `1` — drift detected (release is NOT real — fix before declaring done)
- `2` — error (couldn't fetch a surface — investigate before assuming)

**Rules:**

- **/pubpro is NOT done until Step 10 returns exit 0.** A green CI badge (Step 9.5) is necessary but not sufficient. The truth-table is the contract.
- If Step 10 surfaces drift, fix it before posting any release announcement. The drift might be: a missing tag, an un-cut GH Release, a never-published MCP Registry version, or uncommitted state. Each is fixable in minutes once the verifier names it.
- If Step 10 reports a warning (e.g., MCP Registry not yet propagated), wait 60s and re-run. Registry indexing can lag by up to a minute.
- If Step 10 keeps reporting drift after fixes, escalate to investigation — don't paper over the warning.

**Run Step 10 also as a standalone audit** (not just post-publish):

```bash
# Across all FAF packages — catches drift between releases
for path in /Users/wolfejam/FAF/cli /Users/wolfejam/FAF/claude-faf-mcp \
            /Users/wolfejam/FAF/faf-mcp /Users/wolfejam/FAF/grok-faf-mcp \
            /Users/wolfejam/FAF/gemini-faf-mcp /Users/wolfejam/FAF/WJTTC; do
  bash ~/.claude/skills/pubpro/scripts/release-verify.sh "$path"
done
```

The audit pattern catches the "stalled-publish" trap (per `feedback-version-bump-without-publish-trap.md`) — manifest bumped, then session ends, no ship for 14 days. Run periodically to keep the ecosystem coherent.

**(Optional) Post-Publish Assets:**
- `/pubblog` — Blog post for faf.one (do this first, everything flows from the blog)
- **`/dev-notes <version>`** — stranger cold-install of the **published** pin (install tips + shape receipts). **Last tell-step after close:** extras go as an **X reply under the existing parent**, never a second parent, never a second AAIF Social Link. Not a publish gate. See `~/.claude/skills/dev-notes/SKILL.md`.
- `/diagram-builder` — HTML/CSS architecture diagram for hero image (screenshot-ready, FAF-styled)
- `/gif-recorder` — VHS terminal recording for compile/usage demos (GIF format)
- X/Twitter: `https://twitter.com/intent/tweet?text=...&url=...`

## Emergency Rollback

If something goes wrong:

```bash
# Within 72 hours
npm unpublish <package>@<version>

# After 72 hours
npm deprecate <package>@<version> "Rollback - use <previous-version>"
```

## Why This Exists

- Trust is everything
- Production infrastructure for thousands of developers
- Official Anthropic MCP steward responsibility
- One bad publish = permanent reputation damage
- FAF Ecosystem #2759 - 5 MCP servers serving Claude, Grok, Gemini

**Professional. Boring. Trusted.**

## Quick Reference

```
FAF Ecosystem #2759
├── claude-faf-mcp   (npm + MCP Registry)
├── faf-mcp          (npm + MCP Registry)
├── grok-faf-mcp     (npm + MCP Registry)
├── gemini-faf-mcp   (PyPI + MCP Registry)
├── WJTTC            (npm + MCP Registry)
├── faf-cli          (npm + Homebrew)
└── mcpaas-cf        (Cloudflare Workers)
```

**MCP Registry:** `registry.modelcontextprotocol.io` · namespace `one.faf/*` (DNS) · schema per current `server.json` `$schema`  
**CFM Core tools (default):** 12 · Extended: `FAF_TOOLS=all` · no `faf_enhance`  
**PyPI Auth:** Trusted Publisher (OIDC)  
**npm Auth:** Standard npm login  

### Changelog (skill)

- **2026-10-07** — Doc Gate 101 also checks `.claude-plugin/plugin.json` and project.faf's `version:` (both missed at faf-cli 8.2.1, caught by CI). faf-cli's extra build steps are now `check:engines` · `check:no-hardcode` · `lint` (`build:verify`/`version:truth` are gone); run `npm test` after the bump.
- **2026-09-28** — mcpaas-cf is hybrid: Workers Builds uploads versions only (`wrangler versions upload`), `deploy.yml` is the one deployer, gated on `test:taf` (also on PRs).
- **2026-09-27** — **§ Auto-deploy repos: the merge is the GO** (mcpaas-cf auto-deploys via `deploy.yml`): all pre-GO gates run on the PR, the PR body carries the approval table, wolfejam merges last, then post-deploy → tag → truth-table. Step 7/7.5 no longer say `wrangler deploy` by hand; dry-run pinned `wrangler@4`; flag a second deployer (Workers Builds). Memory: `feedback-auto-deploy-merge-is-go`.
- **2026-09-02** — Dual-registry ships need **two `/pub*`** (rust-faf-mcp: `/pubcrate` + `/pubpro`). Memory: `doctrine-pub-series-only-two-registries-two-pubs`.
- **2026-08-19** — `/dev-notes` after close = X **reply** under the ship/AAIF parent (mcp-better 0.5.0 receipt), not a new parent.
- **2026-08-11** — **§6.75 npm whoami gate + user-terminal handoff** (agent E401 ≠ user auth; no `_authToken` essay; resume after `npm view`); `release-verify.sh` always `git fetch --tags` before tag dimension (false vN-1 drift after `gh release create`).
- **2026-08-06** — Doc identity table (version · edition-name · oneliner); §1.55-MCP surface map; Doc Gate 101 covers server.json + manifest.json; `/pubpro mcp` profile checklist; Five Fingers → `one.faf/*`; CFM Core 12 + compose-floor reachability; thin CLI command file demoted to pointer.
