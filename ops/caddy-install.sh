#!/usr/bin/env bash
set -euo pipefail

execute=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute)
      execute=1
      shift
      ;;
    --dry-run)
      execute=0
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
caddyfile="$repo_root/ops/Caddyfile.example"

echo "repo: $repo_root"
echo "caddyfile: $caddyfile"

if ! command -v brew >/dev/null 2>&1; then
  if [[ "$execute" != "1" ]]; then
    echo "dry-run: brew install caddy"
    echo "dry-run: caddy validate --config $caddyfile"
    echo "next: install Homebrew or choose another approved package manager before executing Caddy installation"
    echo "blocked: Homebrew is not installed or not in PATH"
    exit 1
  fi
  echo "blocked: Homebrew is not installed or not in PATH" >&2
  exit 1
fi

if [[ "$execute" == "1" ]]; then
  echo "+ brew install caddy"
  brew install caddy
else
  echo "dry-run: brew install caddy"
fi

if command -v caddy >/dev/null 2>&1; then
  echo "+ caddy validate --config $caddyfile"
  caddy validate --config "$caddyfile"
else
  echo "dry-run: caddy validate --config $caddyfile"
fi

echo "next: configure Caddy service manually or through an approved service manager after DNS/router prerequisites are ready"
