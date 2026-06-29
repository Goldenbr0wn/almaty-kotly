#!/usr/bin/env bash
set -euo pipefail

execute=0
source_file="/path/to/filled-alatau-supabase.env"
target_file="/Users/azat/.codex/secrets/alatau-supabase.env"

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
    --source)
      source_file="${2:-}"
      shift 2
      ;;
    --source=*)
      source_file="${1#--source=}"
      shift
      ;;
    --target)
      target_file="${2:-}"
      shift 2
      ;;
    --target=*)
      target_file="${1#--target=}"
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

echo "source file: $source_file"
echo "target file: $target_file"

if [[ -z "$source_file" || -z "$target_file" ]]; then
  echo "blocked: source and target env file paths are required" >&2
  exit 1
fi

if [[ "$execute" == "1" && "${ALATAU_ENV_INSTALL_CONFIRMED:-}" != "1" ]]; then
  echo "blocked: real env installation requires ALATAU_ENV_INSTALL_CONFIRMED=1" >&2
  exit 1
fi

if [[ ! -f "$source_file" ]]; then
  echo "blocked: source env file is missing" >&2
  exit 1
fi

if [[ "$source_file" == "$target_file" ]]; then
  echo "blocked: source and target env files must be different" >&2
  exit 1
fi

if [[ "$execute" == "1" ]]; then
  echo "+ npm run supabase:env-audit -- --file [redacted-source]"
  npm run supabase:env-audit -- --file "$source_file"
  echo "+ mkdir -p $(dirname "$target_file")"
  mkdir -p "$(dirname "$target_file")"
  echo "+ install -m 600 [redacted-source] $target_file"
  install -m 600 "$source_file" "$target_file"
  echo "+ npm run supabase:env-audit -- --file $target_file"
  npm run supabase:env-audit -- --file "$target_file"
else
  echo "+ npm run supabase:env-audit -- --file [redacted-source]"
  npm run supabase:env-audit -- --file "$source_file"
  echo "dry-run: mkdir -p $(dirname "$target_file")"
  echo "dry-run: install -m 600 [redacted-source] $target_file"
  echo "dry-run: npm run supabase:env-audit -- --file $target_file"
fi

echo "next: run npm run supabase:readiness and npm run supabase:preflight against the installed env file"
