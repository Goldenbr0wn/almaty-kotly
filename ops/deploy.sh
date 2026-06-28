#!/usr/bin/env bash
set -euo pipefail

dry_run=0
if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
sha="$(git -C "$repo_root" rev-parse HEAD)"
status="$(git -C "$repo_root" status --short)"
release_root="${ALATAU_RELEASE_ROOT:-/srv/alatau-service/releases}"
current_link="${ALATAU_CURRENT_LINK:-/srv/alatau-service/current}"
release_dir="$release_root/$sha"

echo "repo: $repo_root"
echo "sha: $sha"
echo "release_dir: $release_dir"
echo "current_link: $current_link"

if [[ -n "$status" ]]; then
  echo "dirty tree detected; refusing real deploy"
  if [[ "$dry_run" == "1" ]]; then
    echo "dry-run: dirty tree gate observed"
    exit 0
  fi
  exit 1
fi

if [[ "$dry_run" == "1" ]]; then
  echo "dry-run: would run npm ci, npm run build, copy standalone output, update current symlink"
  exit 0
fi

npm ci
APP_RELEASE_SHA="$sha" APP_RELEASE_ID="$sha" APP_BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)" npm run build
npm run prepare:standalone
mkdir -p "$release_dir"
cp -R .next/standalone "$release_dir/app"
ln -sfn "$release_dir/app" "$current_link"
echo "deploy ready: $current_link"
