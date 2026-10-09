#!/usr/bin/env bash
# npm whoami gate — FAF. Exit 0 if wolfejam.dev; NOTICE + macOS banner + exit 1 on 401.
# Used by /pubpro · /pubcrate · zsh `npm publish` wrapper. Never retries OIDC.
set -euo pipefail

EXPECTED="wolfejam.dev"
WHO="$(npm whoami 2>/dev/null || true)"

if [[ "$WHO" == "$EXPECTED" ]]; then
  exit 0
fi

echo ""
echo "NOTICE: npm 401 — not logged in as ${EXPECTED}."
echo "  whoami → ${WHO:-E401}"
echo "  Stop. Do not publish. Do not re-dispatch CI."
echo "  This Terminal: npm login   (2-hour session)"
echo "  Durable: 90-day granular write token → ~/.npmrc"
echo ""

osascript -e 'display notification "npm 401 — not wolfejam.dev. Session dead." with title "FAF npm" sound name "Basso"' >/dev/null 2>&1 || true

exit 1
