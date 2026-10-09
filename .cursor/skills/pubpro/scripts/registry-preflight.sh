#!/usr/bin/env bash
# registry-preflight.sh — the dry-run the MCP Registry doesn't give you.
#
# `mcp-publisher publish` has NO --dry-run: every server-side validation only
# fires on the real, irreversible publish. The claude-faf-mcp 5.9.1 pilot hit
# THREE sequential 400s discovering them one at a time. This script checks all
# of them LOCALLY first, so a publish either pre-flights GREEN (then succeeds on
# the first try) or tells you exactly which 400 you'd hit. Read-only — publishes
# nothing, changes nothing.
#
# Usage:  registry-preflight.sh [dir-with-server.json]   (default: .)
# Exit:   0 = all green (safe to publish) · 1 = a blocker · 2 = warnings only
set -uo pipefail

DIR="${1:-.}"
SJ="$DIR/server.json"
fail=0; warn=0
ok(){ echo "  ✅ $1"; }
no(){ echo "  🚫 $1"; fail=1; }
wn(){ echo "  ⚠️  $1"; warn=1; }

[ -f "$SJ" ] || { echo "🚫 no server.json at $SJ"; exit 1; }
python3 -c "import json;json.load(open('$SJ'))" 2>/dev/null || { echo "🚫 server.json is not valid JSON"; exit 1; }

NAME=$(python3 -c "import json;print(json.load(open('$SJ'))['name'])")
VER=$(python3 -c "import json;print(json.load(open('$SJ'))['version'])")
echo "── registry pre-flight: $NAME@$VER ──"

# 1 — version coherence (server.json vs package.json vs manifest.json)
for f in package.json manifest.json; do
  [ -f "$DIR/$f" ] || continue
  v=$(python3 -c "import json;print(json.load(open('$DIR/$f')).get('version',''))" 2>/dev/null)
  [ "$v" = "$VER" ] && ok "$f version $v" || no "$f version '$v' ≠ server.json '$VER'"
done

# 2 — mcpName ownership (pilot 400 #1): published npm pkg must declare mcpName == NAME
while IFS= read -r pv; do
  [ -z "$pv" ] && continue
  got=$(npm view "$pv" mcpName 2>/dev/null)
  if   [ -z "$got" ];        then no "npm $pv: mcpName not on npm yet — PUBLISH NPM FIRST (or wait for propagation)";
  elif [ "$got" = "$NAME" ]; then ok "npm $pv mcpName == $NAME";
  else no "npm $pv mcpName='$got' ≠ server.json '$NAME' — registry will 400 (ownership)"; fi
done < <(python3 -c "import json;[print(p['identifier']+'@'+p.get('version','')) for p in json.load(open('$SJ')).get('packages',[]) if p.get('registryType')=='npm']")

# 3 — mcpb downloadable + sha (pilot 400 #2)
while IFS='|' read -r url sha; do
  [ -z "$url" ] && continue
  code=$(curl -sI -o /dev/null -w '%{http_code}' -L "$url")
  if [ "$code" = "200" ]; then
    ok "mcpb URL HTTP 200"
    if [ -n "$sha" ]; then
      got=$(curl -sL "$url" | shasum -a 256 | awk '{print $1}')
      [ "$got" = "$sha" ] && ok "mcpb sha matches server.json" || no "mcpb sha mismatch (served $got ≠ json $sha)"
    fi
  else no "mcpb URL HTTP $code — create the GitHub release + attach the .mcpb FIRST"; fi
done < <(python3 -c "import json;[print(p['identifier']+'|'+p.get('fileSha256','')) for p in json.load(open('$SJ')).get('packages',[]) if p.get('registryType')=='mcpb']")

# 4 — remote URL uniqueness (pilot 400 #3): a remote belongs to ONE registry entry
while IFS= read -r url; do
  [ -z "$url" ] && continue
  owner=$(curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=$(basename "$url")&limit=100" 2>/dev/null | python3 -c "
import sys,json
u='$url'; me='$NAME'
try:
  for s in json.load(sys.stdin).get('servers',[]):
    srv=s.get('server',s)
    for r in srv.get('remotes',[]) or []:
      if r.get('url')==u and srv.get('name')!=me: print(srv.get('name')); raise SystemExit
except SystemExit: pass
except Exception: pass
")
  [ -z "$owner" ] && ok "remote $url unclaimed" || no "remote $url already held by '$owner' — drop it (transition) or deprecate that entry first"
done < <(python3 -c "import json;[print(r['url']) for r in json.load(open('$SJ')).get('remotes',[]) or []]")

# 5 — auth present (best-effort: mcp-publisher has no whoami; check the token cache)
# Login method branches on the namespace this server.json actually declares —
# one.faf/* is DNS-authed, everything else (io.github.*, the AAIF lane) is
# GitHub OIDC/device-flow. Don't hint the wrong one.
NS="${NAME%%/*}"
if [ "$NS" = "one.faf" ]; then LOGIN_HINT="mcp-publisher login dns --domain <your-domain>"; AUTH_NOTE="ensure DNS-authed for one.faf/*";
else LOGIN_HINT="mcp-publisher login github"; AUTH_NOTE="ensure GitHub-OIDC-authed for $NS/*"; fi
# mcp-publisher 1.x writes its session to the REPO ROOT
# (.mcpregistry_registry_token), not ~/.mcp-publisher* or ~/.config. Check each
# candidate independently — a compound `ls a b c` exits non-zero if ANY arg is
# missing, even when a real file matched. (Presence only; the JWT can still be
# expired — only a real `mcp-publisher publish` proves validity.)
sess=""
for p in "$DIR"/.mcpregistry_registry_token "$DIR"/.mcpregistry_github_token "$HOME"/.mcp-publisher "$HOME"/.config/mcp-publisher; do
  [ -e "$p" ] && { sess="$p"; break; }
done
if [ -n "$sess" ]; then ok "mcp-publisher session file present ($AUTH_NOTE; may still be expired)";
else wn "no mcp-publisher session found — run: $LOGIN_HINT"; fi

echo "──"
[ "$fail" = 1 ] && { echo "🚫 PRE-FLIGHT FAILED — fix every 🚫 above before publishing. NOTHING was published."; exit 1; }
[ "$warn" = 1 ] && { echo "⚠️  pre-flight passed with warnings (review the ⚠️ lines)."; exit 2; }
echo "✅ PRE-FLIGHT GREEN — registry publish should succeed on the first try."
exit 0
