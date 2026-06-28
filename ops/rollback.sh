#!/usr/bin/env bash
set -euo pipefail

dry_run=0
if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=1
fi

release_root="${ALATAU_RELEASE_ROOT:-/srv/alatau-service/releases}"
current_link="${ALATAU_CURRENT_LINK:-/srv/alatau-service/current}"

echo "release_root: $release_root"
echo "current_link: $current_link"
if [[ "$dry_run" == "1" ]]; then
  echo "dry-run: would select previous release directory and update current symlink"
  echo "dry-run: database migrations are not rolled back automatically"
  exit 0
fi

previous="$(find "$release_root" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 2 | head -n 1)"
if [[ -z "$previous" ]]; then
  echo "no previous release found"
  exit 1
fi
ln -sfn "$previous/app" "$current_link"
echo "rolled back to $previous"
