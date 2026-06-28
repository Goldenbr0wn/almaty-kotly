#!/usr/bin/env bash
set -euo pipefail

mode="${1:---local}"
if [[ "$mode" == "--production" ]]; then
  base_url="https://alatau-service.com"
else
  base_url="${APP_HEALTH_BASE_URL:-http://127.0.0.1:5173}"
fi

echo "healthcheck target: $base_url"
curl -fsS "$base_url/api/health" >/dev/null
curl -fsS "$base_url/release.json" >/dev/null
echo "healthcheck ok"
