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

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
sha="$(git -C "$repo_root" rev-parse HEAD)"
status="$(git -C "$repo_root" status --short)"
release_root="${ALATAU_RELEASE_ROOT:-/Users/azat/Services/alatau-service/releases}"
current_link="${ALATAU_CURRENT_LINK:-/Users/azat/Services/alatau-service/current}"
runtime_env_file="${ALATAU_SUPABASE_ENV_FILE:-/Users/azat/.codex/secrets/alatau-supabase.env}"
service_root="$(dirname "$current_link")"
release_dir="$release_root/$sha"
built_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "repo: $repo_root"
echo "sha: $sha"
echo "release_dir: $release_dir"
echo "current_link: $current_link"
echo "runtime_env_file: $runtime_env_file"

if [[ "$dry_run" != "1" && "${ALATAU_DEPLOY_CONFIRMED:-}" != "1" ]]; then
  echo "blocked: real deploy requires ALATAU_DEPLOY_CONFIRMED=1 after reviewed readiness gates" >&2
  exit 1
fi

if [[ "$dry_run" != "1" ]]; then
  npm run supabase:env-audit -- --file "$runtime_env_file"
fi

if [[ -n "$status" ]]; then
  echo "dirty tree detected; refusing real deploy"
  if [[ "$dry_run" == "1" ]]; then
    echo "dry-run: dirty tree gate observed"
    exit 0
  fi
  exit 1
fi

if [[ "$dry_run" == "1" ]]; then
  echo "dry-run: would run env audit, npm ci, npm run security:scan, npm run build, copy standalone output, update current symlink, write release receipts"
  echo "dry-run: real deploy also requires ALATAU_DEPLOY_CONFIRMED=1"
  echo "dry-run: set ALATAU_RELEASE_ROOT/ALATAU_CURRENT_LINK/ALATAU_SUPABASE_ENV_FILE to override macOS defaults"
  exit 0
fi

npm ci
npm run security:scan
APP_RELEASE_SHA="$sha" APP_RELEASE_ID="$sha" APP_BUILT_AT="$built_at" npm run build
npm run prepare:standalone
mkdir -p "$release_dir"
cp -R .next/standalone "$release_dir/app"
cat > "$release_dir/release.json" <<EOF
{
  "sha": "$sha",
  "builtAt": "$built_at",
  "releaseDir": "$release_dir",
  "currentLink": "$current_link"
}
EOF
ln -sfn "$release_dir/app" "$current_link"
mkdir -p "$service_root"
cp "$release_dir/release.json" "$service_root/current-release.json"
echo "deploy ready: $current_link"
