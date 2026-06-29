#!/usr/bin/env bash
set -euo pipefail

execute=0
skip_readiness=0

for arg in "$@"; do
  case "$arg" in
    --execute) execute=1 ;;
    --skip-readiness) skip_readiness=1 ;;
    --dry-run) execute=0 ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ "$execute" == "1" && "$skip_readiness" == "1" ]]; then
  echo "blocked: --skip-readiness is allowed only in dry-run mode" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_root="${ALATAU_RELEASE_ROOT:-/Users/azat/Services/alatau-service/releases}"
current_link="${ALATAU_CURRENT_LINK:-/Users/azat/Services/alatau-service/current}"
runtime_env_file="${ALATAU_SUPABASE_ENV_FILE:-/Users/azat/.codex/secrets/alatau-supabase.env}"
service_root="$(dirname "$current_link")"
launch_agent="$HOME/Library/LaunchAgents/com.alatau-service.web.plist"
rendered_launch_agent=""

run_or_print() {
  if [[ "$execute" == "1" ]]; then
    echo "+ $*"
    "$@"
  else
    printf 'dry-run:'
    printf ' %q' "$@"
    printf '\n'
  fi
}

run_gate() {
  local label="$1"
  shift
  local gate_status
  echo "step: $label"
  set +e
  "$@"
  gate_status=$?
  set -e
  if [[ "$gate_status" == "0" ]]; then
    return 0
  fi
  if [[ "$execute" == "1" ]]; then
    echo "blocked: $label failed in execute mode" >&2
    exit "$gate_status"
  fi
  echo "dry-run: $label failed; continuing to show remaining planned commands"
  return 0
}

run_report() {
  local label="$1"
  shift
  local report_status
  echo "step: $label"
  set +e
  "$@"
  report_status=$?
  set -e
  if [[ "$report_status" == "0" ]]; then
    return 0
  fi
  echo "report: $label returned blockers; continuing because bootstrap install is expected to clear launchd/app-port blockers"
  return 0
}

xml_escape() {
  local value="$1"
  value="${value//&/&amp;}"
  value="${value//</&lt;}"
  value="${value//>/&gt;}"
  printf '%s' "$value"
}

render_launch_agent() {
  local target="$1"
  local server_js="$current_link/server.js"
  local log_root="$service_root/logs"
  local command
  local escaped_command
  local escaped_current_link
  local escaped_stdout
  local escaped_stderr

  command="set -a; source \"$runtime_env_file\"; set +a; exec /usr/bin/env node \"$server_js\""
  escaped_command="$(xml_escape "$command")"
  escaped_current_link="$(xml_escape "$current_link")"
  escaped_stdout="$(xml_escape "$log_root/web.out.log")"
  escaped_stderr="$(xml_escape "$log_root/web.err.log")"

  cat > "$target" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.alatau-service.web</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>$escaped_command</string>
  </array>
  <key>WorkingDirectory</key><string>$escaped_current_link</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key><string>5173</string>
    <key>HOSTNAME</key><string>127.0.0.1</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$escaped_stdout</string>
  <key>StandardErrorPath</key><string>$escaped_stderr</string>
</dict>
</plist>
EOF
}

rendered_launch_agent="$(mktemp)"
trap 'rm -f "$rendered_launch_agent"' EXIT

echo "repo: $repo_root"
echo "release_root: $release_root"
echo "current_link: $current_link"
echo "launch_agent: $launch_agent"

cd "$repo_root"

run_gate "env audit" npm run supabase:env-audit -- --file "$runtime_env_file"

if [[ "$skip_readiness" != "1" ]]; then
  run_report "read-only readiness" npm run mac-mini:readiness -- --runtime-env-file="$runtime_env_file"
fi

run_gate "template validation" npm run mac-mini:templates

echo "step: standalone smoke"
npm run mac-mini:standalone-smoke

echo "step: deploy dry-run"
ALATAU_RELEASE_ROOT="$release_root" ALATAU_CURRENT_LINK="$current_link" ALATAU_SUPABASE_ENV_FILE="$runtime_env_file" bash ops/deploy.sh --dry-run

echo "step: install commands"
run_or_print mkdir -p "$release_root" "$service_root/logs" "$HOME/Library/LaunchAgents"

if [[ "$execute" == "1" ]]; then
  ALATAU_DEPLOY_CONFIRMED=1 ALATAU_RELEASE_ROOT="$release_root" ALATAU_CURRENT_LINK="$current_link" ALATAU_SUPABASE_ENV_FILE="$runtime_env_file" bash ops/deploy.sh
else
  echo "dry-run: ALATAU_DEPLOY_CONFIRMED=1 ALATAU_RELEASE_ROOT=$release_root ALATAU_CURRENT_LINK=$current_link ALATAU_SUPABASE_ENV_FILE=$runtime_env_file bash ops/deploy.sh"
fi

echo "step: render launchd plist"
render_launch_agent "$rendered_launch_agent"
run_gate "rendered launchd plist validation" plutil -lint "$rendered_launch_agent"
if [[ "$execute" == "1" ]]; then
  echo "+ install -m 644 [rendered-launchd-plist] $launch_agent"
  install -m 644 "$rendered_launch_agent" "$launch_agent"
else
  echo "dry-run: render launchd plist from current_link=$current_link runtime_env_file=[redacted] logs=$service_root/logs"
  echo "dry-run: install -m 644 [rendered-launchd-plist] $launch_agent"
fi

if [[ "$execute" == "1" ]]; then
  echo "+ launchctl bootstrap gui/$(id -u) $launch_agent"
  launchctl bootstrap "gui/$(id -u)" "$launch_agent" 2>/dev/null || launchctl kickstart -k "gui/$(id -u)/com.alatau-service.web"
  launchctl kickstart -k "gui/$(id -u)/com.alatau-service.web"
else
  echo "dry-run: launchctl bootstrap gui/$(id -u) $launch_agent"
  echo "dry-run: launchctl kickstart -k gui/$(id -u)/com.alatau-service.web"
fi

if [[ "$execute" == "1" ]]; then
  echo "done: mac-mini install execute mode"
else
  echo "done: mac-mini install dry-run mode"
fi
