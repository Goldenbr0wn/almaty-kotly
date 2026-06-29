#!/usr/bin/env bash
set -euo pipefail

mode="--local"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      mode="--local"
      shift
      ;;
    --production)
      mode="--production"
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ "$mode" == "--production" ]]; then
  base_url="https://alatau-service.com"
else
  base_url="${APP_HEALTH_BASE_URL:-http://127.0.0.1:5173}"
fi

echo "healthcheck target: $base_url"
curl -fsS "$base_url/api/health" >/dev/null
curl -fsS "$base_url/release.json" >/dev/null
echo "healthcheck ok"
