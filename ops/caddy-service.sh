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
source_caddyfile="$repo_root/ops/Caddyfile.example"

echo "repo: $repo_root"
echo "source caddyfile: $source_caddyfile"

if [[ ! -f "$source_caddyfile" ]]; then
  echo "blocked: source Caddyfile is missing at $source_caddyfile" >&2
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  if [[ "$execute" != "1" ]]; then
    echo "target caddyfile: unavailable until Homebrew is installed or an approved Caddy config path is chosen"
    echo "dry-run: mkdir -p [caddy-config-dir]"
    echo "dry-run: cp $source_caddyfile [caddy-config-path]"
    echo "dry-run: caddy validate --config [caddy-config-path]"
    echo "dry-run: brew services restart caddy"
    echo "next: install Homebrew or choose another approved service manager before installing the Caddyfile"
    echo "blocked: Homebrew is not installed or not in PATH"
    exit 1
  fi
  echo "blocked: Homebrew is not installed or not in PATH" >&2
  exit 1
fi

brew_prefix="$(brew --prefix)"
target_caddyfile="$brew_prefix/etc/Caddyfile"

echo "target caddyfile: $target_caddyfile"

if [[ "$execute" == "1" && "${ALATAU_CADDY_SERVICE_CONFIRMED:-}" != "1" ]]; then
  echo "blocked: real Caddy service mutation requires ALATAU_CADDY_SERVICE_CONFIRMED=1" >&2
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "blocked: Caddy is not installed or not in PATH; run bash ops/caddy-install.sh --execute after approval first" >&2
  exit 1
fi

if [[ "$execute" == "1" ]]; then
  echo "+ mkdir -p $(dirname "$target_caddyfile")"
  mkdir -p "$(dirname "$target_caddyfile")"
  echo "+ cp $source_caddyfile $target_caddyfile"
  cp "$source_caddyfile" "$target_caddyfile"
  echo "+ caddy validate --config $target_caddyfile"
  caddy validate --config "$target_caddyfile"
  echo "+ brew services restart caddy"
  brew services restart caddy
else
  echo "dry-run: mkdir -p $(dirname "$target_caddyfile")"
  echo "dry-run: cp $source_caddyfile $target_caddyfile"
  echo "dry-run: caddy validate --config $target_caddyfile"
  echo "dry-run: brew services restart caddy"
fi

echo "next: run npm run mac-mini:network-probe and confirm local ports 80/443 are listening before router or DNS changes"
