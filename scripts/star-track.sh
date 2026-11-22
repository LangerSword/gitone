#!/usr/bin/env bash
# Weekly Gitone growth baseline. Read-only; no writes to the repo.
set -euo pipefail
REPO=LangerSword/gitone
SITE=https://gitone.langersword.in

echo "== $(date -u +%FT%TZ) =="
gh api "repos/$REPO" --jq '"stars=\(.stargazers_count) forks=\(.forks_count) open_issues=\(.open_issues_count)"'
echo "-- top referrers (last 14 days) --"
REF=$(gh api "repos/$REPO/traffic/referrers" --jq '.referrers[:10][] | "\(.referrer): \(.count) views, \(.uniques) unique"' 2>/dev/null || true)
if [ -n "$REF" ] && ! printf '%s' "$REF" | grep -q 'Not Found'; then printf '%s\n' "$REF"; else echo "referrers unavailable"; fi
echo "-- cold card fetch x5 --"
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code} " -m 20 "$SITE/torvalds.png?track=$RANDOM$i"
done
echo
echo "-- open good-first issues --"
gh issue list -L 10 --label "good first issue" --json number,title --jq '.[] | "#\(.number) \(.title)"'
