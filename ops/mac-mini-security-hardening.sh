#!/usr/bin/env bash
set -euo pipefail

execute=0
disable_remote_login=0

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
    --disable-remote-login)
      disable_remote_login=1
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

firewall_cmd="/usr/libexec/ApplicationFirewall/socketfilterfw"

echo "target: mac-mini-self-host"
echo "firewall command: $firewall_cmd"
echo "disable remote login: $disable_remote_login"

if [[ ! -x "$firewall_cmd" ]]; then
  echo "blocked: macOS firewall command is missing at $firewall_cmd" >&2
  exit 1
fi

if [[ "$execute" == "1" && "${ALATAU_SECURITY_HARDENING_CONFIRMED:-}" != "1" ]]; then
  echo "blocked: real security hardening requires ALATAU_SECURITY_HARDENING_CONFIRMED=1" >&2
  exit 1
fi

run_or_print() {
  if [[ "$execute" == "1" ]]; then
    echo "+ $*"
    "$@"
  else
    echo "dry-run: $*"
  fi
}

run_or_print "$firewall_cmd" --setglobalstate on
run_or_print "$firewall_cmd" --setstealthmode on

if [[ "$disable_remote_login" == "1" ]]; then
  run_or_print systemsetup -setremotelogin off
else
  echo "dry-run: remote login unchanged; pass --disable-remote-login after confirming no needed SSH access"
fi

if [[ "$execute" == "1" ]]; then
  echo "+ npm run mac-mini:security-audit"
  npm run mac-mini:security-audit
else
  echo "dry-run: npm run mac-mini:security-audit"
fi

echo "next: rerun npm run mac-mini:status and confirm securityAudit has no hard blockers before public cutover"
