import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function firewallStateFrom(output) {
  const lower = output.toLowerCase();
  if (lower.includes("enabled")) return "enabled";
  if (lower.includes("disabled")) return "disabled";
  return "unknown";
}

function stealthStateFrom(output) {
  const lower = output.toLowerCase();
  if (lower.includes("enabled") || lower.includes(" on")) return "enabled";
  if (lower.includes("disabled") || lower.includes(" off")) return "disabled";
  return "unknown";
}

function remoteLoginStateFrom(output) {
  const lower = output.toLowerCase();
  if (lower.includes("on")) return "on";
  if (lower.includes("off")) return "off";
  return "unknown";
}

const firewall = run("/usr/libexec/ApplicationFirewall/socketfilterfw", ["--getglobalstate"]);
const stealth = run("/usr/libexec/ApplicationFirewall/socketfilterfw", ["--getstealthmode"]);
const remoteLogin = run("systemsetup", ["-getremotelogin"]);

const facts = {
  firewall: {
    available: firewall.ok,
    state: firewall.ok ? firewallStateFrom(firewall.stdout) : "unknown"
  },
  stealthMode: {
    available: stealth.ok,
    state: stealth.ok ? stealthStateFrom(stealth.stdout) : "unknown"
  },
  remoteLogin: {
    available: remoteLogin.ok,
    state: remoteLogin.ok ? remoteLoginStateFrom(remoteLogin.stdout) : "unknown"
  }
};

const blockers = [];
const warnings = [];
const nextActions = [];

if (!facts.firewall.available || facts.firewall.state === "unknown") {
  blockers.push("macOS application firewall state could not be verified");
  nextActions.push("verify macOS firewall state locally before public cutover");
} else if (facts.firewall.state !== "enabled") {
  blockers.push("macOS application firewall is not enabled");
  nextActions.push("after approval, enable macOS application firewall and allow only the approved web runtime/proxy paths");
}

if (!facts.stealthMode.available || facts.stealthMode.state === "unknown") {
  warnings.push("macOS stealth mode state could not be verified");
} else if (facts.stealthMode.state !== "enabled") {
  warnings.push("macOS stealth mode is not enabled");
  nextActions.push("after approval, enable macOS firewall stealth mode");
}

if (!facts.remoteLogin.available || facts.remoteLogin.state === "unknown") {
  warnings.push("remote login state could not be verified");
} else if (facts.remoteLogin.state === "on") {
  warnings.push("remote login is enabled; confirm SSH is key-only and limited to the intended user before public cutover");
  nextActions.push("if remote login is needed, confirm key-only SSH and no broad admin/root access; otherwise disable remote login after approval");
}

console.log(JSON.stringify({
  ok: blockers.length === 0,
  target: "mac-mini-self-host",
  checks: {
    firewall: facts.firewall,
    stealthMode: facts.stealthMode,
    remoteLogin: facts.remoteLogin
  },
  blockers,
  warnings,
  nextActions: [...new Set(nextActions)]
}, null, 2));

process.exit(blockers.length === 0 ? 0 : 1);
