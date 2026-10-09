#!/usr/bin/env bash
# release-verify.sh — FAF release truth-table verifier
#
# Verifies that a release is COHERENT across all 6 dimensions:
#   1. Manifest version (package.json or pyproject.toml)
#   2. Latest git tag
#   3. GitHub Release
#   4. Registry version (npm or PyPI)
#   5. MCP Registry version (if applicable)
#   6. Working tree clean
#
# A release is REAL only when all 6 surfaces report the same version
# and the working tree has no uncommitted state.
#
# Usage:
#   release-verify.sh                  # use cwd
#   release-verify.sh <repo-path>      # specify path
#
# Exit codes:
#   0 — all dimensions aligned (release is REAL)
#   1 — drift detected (release is NOT real)
#   2 — error (couldn't fetch data, missing tools)

set -uo pipefail

# Ensure portable PATH (script may be invoked from sandboxed contexts)
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:${PATH:-}"

REPO_PATH="${1:-$(pwd)}"
cd "$REPO_PATH" 2>/dev/null || { echo "ERROR: cannot cd to $REPO_PATH" >&2; exit 2; }

# Colors (disable with NO_COLOR=1)
if [[ -z "${NO_COLOR:-}" ]] && [[ -t 1 ]]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  CYAN=$'\033[36m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; CYAN=""; BOLD=""; DIM=""; RESET=""
fi

ERRORS=0
WARNINGS=0

# ── Detect manifest type and read version ──
PACKAGE_NAME=""
MANIFEST_VERSION=""
REGISTRY_TYPE=""
MCP_NAME=""

if [[ -f package.json ]]; then
  REGISTRY_TYPE="npm"
  PACKAGE_NAME=$(python3 -c "import json; d=json.load(open('package.json')); print(d.get('name',''))" 2>/dev/null || echo "")
  MANIFEST_VERSION=$(python3 -c "import json; d=json.load(open('package.json')); print(d.get('version',''))" 2>/dev/null || echo "")
  MCP_NAME=$(python3 -c "import json; d=json.load(open('package.json')); print(d.get('mcpName',''))" 2>/dev/null || echo "")
elif [[ -f pyproject.toml ]]; then
  REGISTRY_TYPE="pypi"
  PACKAGE_NAME=$(grep -E '^name = ' pyproject.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
  MANIFEST_VERSION=$(grep -E '^version = ' pyproject.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
  # PyPI MCPs may declare mcpName via [tool.faf] or similar — best-effort grep
  MCP_NAME=$(grep -E '^mcpName = ' pyproject.toml 2>/dev/null | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || echo "")
else
  echo "${RED}ERROR:${RESET} no package.json or pyproject.toml found in $REPO_PATH" >&2
  exit 2
fi

if [[ -z "$MANIFEST_VERSION" ]] || [[ -z "$PACKAGE_NAME" ]]; then
  echo "${RED}ERROR:${RESET} could not read package name or version from manifest" >&2
  exit 2
fi

# ── Fetch all 6 dimensions ──

# 2. Latest git tag
# Always refresh tags first — `gh release create` writes the tag on origin;
# a local clone that never ran `git fetch --tags` falsely reports drift
# (hit live on claude-faf-mcp 5.21.0 — truth-table said v5.20.0 until fetch).
git fetch --tags --quiet 2>/dev/null || true
# Release tags only: vX.Y.Z. Staging pre-releases (vX.Y.ZrcN / aN / bN / -alpha…)
# and archive/* tags are not releases, and would otherwise sort as "latest".
LATEST_TAG=$(git tag --sort=-v:refname 2>/dev/null | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || echo "")
TAG_VERSION="${LATEST_TAG#v}"

# 3. GitHub Release
GH_RELEASE_TAG=$(gh release list --limit 1 --json tagName --jq '.[0].tagName // ""' 2>/dev/null || echo "")
GH_RELEASE_VERSION="${GH_RELEASE_TAG#v}"
GH_RELEASE_DATE=$(gh release list --limit 1 --json publishedAt --jq '.[0].publishedAt // ""' 2>/dev/null | cut -dT -f1 || echo "")

# 4. Registry version (npm or PyPI)
case "$REGISTRY_TYPE" in
  npm)
    # Use npm registry REST API (works without npm CLI on PATH)
    REGISTRY_VERSION=$(curl -sf "https://registry.npmjs.org/$PACKAGE_NAME/latest" 2>/dev/null | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('version',''))" 2>/dev/null || echo "")
    REGISTRY_LABEL="npm registry"
    ;;
  pypi)
    REGISTRY_VERSION=$(curl -sf "https://pypi.org/pypi/$PACKAGE_NAME/json" 2>/dev/null | \
      python3 -c "import sys,json; print(json.load(sys.stdin)['info']['version'])" 2>/dev/null || echo "")
    REGISTRY_LABEL="PyPI registry"
    ;;
esac

# 5. MCP Registry (if applicable)
# Ask the AUTHORITATIVE version-detail endpoint for THIS exact version — never the
# fuzzy ?search= list (it caps results, can hide the entry behind pagination, and
# doesn't pin the version). Same endpoint as /pubpro Step 8e. Publisher-provided
# data lives in server._meta; registry-managed data (isLatest, updatedAt) lives in
# the top-level _meta["io.modelcontextprotocol.registry/official"].
# Fixed 2026-10-05 after grok-faf-mcp 2.1.0: ?search= timed out and was reported
# as "no entry found" while the detail endpoint had already served 2.1.0 as latest.
MCP_REGISTRY_VERSION=""
MCP_REGISTRY_DATE=""
MCP_REGISTRY_STATE=""   # ok | absent | unreachable
if [[ -n "$MCP_NAME" ]]; then
  MCP_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$MCP_NAME")
  MCP_URL="https://registry.modelcontextprotocol.io/v0.1/servers/${MCP_ENC}/versions/${MANIFEST_VERSION}"
  for attempt in 1 2 3; do
    MCP_CODE=$(curl -s -m 15 -o /tmp/release-verify-mcp.$$ -w "%{http_code}" "$MCP_URL" 2>/dev/null || echo "000")
    [[ "$MCP_CODE" == "200" || "$MCP_CODE" == "404" ]] && break
    sleep 4
  done
  if [[ "$MCP_CODE" == "200" ]]; then
    MCP_OUT=$(python3 -c "
import json
d = json.load(open('/tmp/release-verify-mcp.$$'))
srv = d.get('server', {})
off = d.get('_meta', {}).get('io.modelcontextprotocol.registry/official', {})
print(srv.get('version', ''), (off.get('updatedAt') or '')[:10], off.get('isLatest'))
" 2>/dev/null || echo "")
    MCP_REGISTRY_VERSION=$(echo "$MCP_OUT" | awk '{print $1}')
    MCP_REGISTRY_DATE=$(echo "$MCP_OUT" | awk '{print $2}')
    MCP_IS_LATEST=$(echo "$MCP_OUT" | awk '{print $3}')
    MCP_REGISTRY_STATE="ok"
  elif [[ "$MCP_CODE" == "404" ]]; then
    MCP_REGISTRY_STATE="absent"
  else
    MCP_REGISTRY_STATE="unreachable"
  fi
  rm -f /tmp/release-verify-mcp.$$
fi

# 6. Working tree
DIRTY_COUNT=$(git status --short 2>/dev/null | wc -l | tr -d ' ')

# ── Print truth table ──
echo
echo "${BOLD}${CYAN}═══ Release Truth-Table: $PACKAGE_NAME v$MANIFEST_VERSION ═══${RESET}"
echo

# Helper to print a row
row_match() {
  local label="$1"
  local value="$2"
  local extra="${3:-}"
  printf "  %s✅%s %-22s %s%s\n" "$GREEN" "$RESET" "$label" "$value" "$extra"
}

row_drift() {
  local label="$1"
  local value="$2"
  printf "  %s🚫%s %-22s %s%s%s  %s← drift from %s%s\n" \
    "$RED" "$RESET" "$label" "$RED" "$value" "$RESET" "$DIM" "$MANIFEST_VERSION" "$RESET"
  ERRORS=$((ERRORS+1))
}

row_missing() {
  local label="$1"
  local hint="${2:-not found}"
  printf "  %s⚠️ %s %-22s %s(%s)%s\n" "$YELLOW" "$RESET" "$label" "$DIM" "$hint" "$RESET"
  WARNINGS=$((WARNINGS+1))
}

# 1. Manifest (the source of truth — always green)
printf "  %s✅%s %-22s %s  %s($REGISTRY_TYPE: %s)%s\n" \
  "$GREEN" "$RESET" "Manifest:" "$MANIFEST_VERSION" "$DIM" "$PACKAGE_NAME" "$RESET"

# 2. Git tag
if [[ -z "$TAG_VERSION" ]]; then
  row_missing "Latest git tag:" "no tags in repo"
elif [[ "$TAG_VERSION" == "$MANIFEST_VERSION" ]]; then
  row_match "Latest git tag:" "v$TAG_VERSION"
else
  row_drift "Latest git tag:" "v$TAG_VERSION"
fi

# 3. GitHub Release
if [[ -z "$GH_RELEASE_VERSION" ]]; then
  row_missing "GitHub Release:" "no releases on repo"
elif [[ "$GH_RELEASE_VERSION" == "$MANIFEST_VERSION" ]]; then
  row_match "GitHub Release:" "v$GH_RELEASE_VERSION" "  ${DIM}(published $GH_RELEASE_DATE)${RESET}"
else
  row_drift "GitHub Release:" "v$GH_RELEASE_VERSION"
fi

# 4. Registry
if [[ -z "$REGISTRY_VERSION" ]]; then
  row_missing "$REGISTRY_LABEL:" "package not on registry"
elif [[ "$REGISTRY_VERSION" == "$MANIFEST_VERSION" ]]; then
  row_match "$REGISTRY_LABEL:" "$REGISTRY_VERSION"
else
  row_drift "$REGISTRY_LABEL:" "$REGISTRY_VERSION"
fi

# 5. MCP Registry (only if applicable)
if [[ -n "$MCP_NAME" ]]; then
  if [[ "$MCP_REGISTRY_STATE" == "unreachable" ]]; then
    row_missing "MCP Registry:" "registry not answering (timeout, HTTP $MCP_CODE) — re-run later; this is not 'missing'"
  elif [[ "$MCP_REGISTRY_STATE" == "absent" ]]; then
    row_missing "MCP Registry:" "v$MANIFEST_VERSION not published for $MCP_NAME (404 on the version endpoint)"
  elif [[ "$MCP_REGISTRY_VERSION" == "$MANIFEST_VERSION" ]]; then
    row_match "MCP Registry:" "$MCP_REGISTRY_VERSION" "  ${DIM}(updated $MCP_REGISTRY_DATE, isLatest=$MCP_IS_LATEST)${RESET}"
  else
    row_drift "MCP Registry:" "$MCP_REGISTRY_VERSION"
  fi
fi

# 6. Working tree
if [[ "$DIRTY_COUNT" == "0" ]]; then
  row_match "Working tree:" "clean"
else
  printf "  %s🚫%s %-22s %s%s file(s) uncommitted%s\n" \
    "$RED" "$RESET" "Working tree:" "$RED" "$DIRTY_COUNT" "$RESET"
  ERRORS=$((ERRORS+1))
fi

# ── Verdict ──
echo
if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
  echo "  ${BOLD}${GREEN}✪ RELEASE COHERENT — ship is REAL${RESET}"
  echo
  exit 0
elif [[ $ERRORS -eq 0 ]]; then
  echo "  ${BOLD}${YELLOW}⚠️  RELEASE COHERENT (with $WARNINGS warning(s))${RESET}"
  echo "  ${DIM}Warnings flag missing surfaces (e.g., not on MCP Registry yet) — review manually.${RESET}"
  echo
  exit 0
else
  echo "  ${BOLD}${RED}🚨 RELEASE NOT REAL — $ERRORS dimension(s) drift${RESET}"
  echo
  echo "  ${DIM}Action: complete /pubpro for v$MANIFEST_VERSION OR revert manifest to match shipped state.${RESET}"
  echo
  exit 1
fi
