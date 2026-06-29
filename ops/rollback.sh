#!/usr/bin/env bash
set -euo pipefail

dry_run=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

release_root="${ALATAU_RELEASE_ROOT:-/Users/azat/Services/alatau-service/releases}"
current_link="${ALATAU_CURRENT_LINK:-/Users/azat/Services/alatau-service/current}"
service_root="$(dirname "$current_link")"

echo "release_root: $release_root"
echo "current_link: $current_link"
if [[ "$dry_run" == "1" ]]; then
  echo "dry-run: would select previous release directory and update current symlink"
  echo "dry-run: database migrations are not rolled back automatically"
  echo "dry-run: real rollback also requires ALATAU_ROLLBACK_CONFIRMED=1"
  exit 0
fi

if [[ "${ALATAU_ROLLBACK_CONFIRMED:-}" != "1" ]]; then
  echo "blocked: real rollback requires ALATAU_ROLLBACK_CONFIRMED=1 after release target review" >&2
  exit 1
fi

previous="$(find "$release_root" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 2 | head -n 1)"
if [[ -z "$previous" ]]; then
  echo "no previous release found"
  exit 1
fi
ln -sfn "$previous/app" "$current_link"
mkdir -p "$service_root"
cat > "$service_root/current-release.json" <<EOF
{
  "rolledBackAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "releaseDir": "$previous",
  "currentLink": "$current_link"
}
EOF
echo "rolled back to $previous"
