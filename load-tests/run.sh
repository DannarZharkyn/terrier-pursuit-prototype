#!/usr/bin/env bash

set -euo pipefail

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. On macOS, run: brew install k6"
  exit 1
fi

scenario="${1:-read-only}"
profile="${PROFILE:-smoke}"
timestamp="$(date +%Y%m%d-%H%M%S)"
results_dir="load-tests/results/${timestamp}-${scenario}-${profile}"

case "$scenario" in
  read-only)
    script="load-tests/read-only.js"
    ;;
  onboarding)
    script="load-tests/participant-onboarding.js"
    ;;
  *)
    echo "Unknown scenario: $scenario. Use read-only or onboarding."
    exit 1
    ;;
esac

mkdir -p "$results_dir"

K6_WEB_DASHBOARD=true \
K6_WEB_DASHBOARD_EXPORT="$results_dir/report.html" \
k6 run \
  --summary-export "$results_dir/summary.json" \
  -e PROFILE="$profile" \
  -e TARGET_URL="${TARGET_URL:-}" \
  -e GAME_CODE="${GAME_CODE:-}" \
  -e RUN_ID="${RUN_ID:-$timestamp}" \
  -e ALLOW_PRODUCTION="${ALLOW_PRODUCTION:-false}" \
  "$script"

echo "Results saved to $results_dir"
