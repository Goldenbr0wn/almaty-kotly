import { spawnSync } from "node:child_process";
import { argValue } from "./env-file.mjs";

const expectedLocalIp = argValue("--expected-local-ip") || "192.168.8.12";
const domain = argValue("--domain") || "alatau-service.com";
const envFilePath = argValue("--runtime-env-file") || "/Users/azat/.codex/secrets/alatau-supabase.env";
const launchdLabel = argValue("--launchd-label") || "com.alatau-service.web";
const probeTimeoutMs = 5000;

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8", timeout: probeTimeoutMs });
  return result.status === 0 ? result.stdout.trim() : "";
}

function isListening(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8", timeout: probeTimeoutMs });
  return result.status === 0 && result.stdout.trim().length > 0;
}

function commandSucceeds(command, commandArgs) {
  return spawnSync(command, commandArgs, { encoding: "utf8", timeout: probeTimeoutMs }).status === 0;
}

function systemSleepDisabled() {
  const output = run("pmset", ["-g", "custom"]);
  return /^\s*sleep\s+0\s*$/m.test(output);
}

function evaluateMacMiniHostReadiness(input) {
  const blockers = [];
  const warnings = [];
  const nextActions = [];

  if (!input.hostname.toLowerCase().includes("mac-mini")) warnings.push("hostname does not identify the Mac mini host");
  if (!input.os.toLowerCase().includes("macos")) {
    blockers.push("host OS is not macOS");
    nextActions.push("run the Mac mini install path from the intended macOS host");
  }

  if (!input.localIp) {
    blockers.push("local IPv4 address is missing");
    nextActions.push("verify Wi-Fi/Ethernet connectivity and reserve the Mac mini LAN address before cutover");
  } else if (input.localIp !== input.expectedLocalIp) {
    blockers.push(`local IPv4 is ${input.localIp}, expected reserved ${input.expectedLocalIp}`);
    nextActions.push(`reserve or set the Mac mini LAN IPv4 to ${input.expectedLocalIp}`);
  }

  if (!input.publicIp) warnings.push("public IPv4 was not detected");
  if (!input.envFileExists) {
    blockers.push(`runtime env file is missing at ${input.envFilePath}`);
    nextActions.push(`install a filled copy of ops/alatau-supabase.env.template at ${input.envFilePath} with mode 0600`);
  }
  if (!input.caddyInstalled) {
    blockers.push("Caddy is not installed or not in PATH");
    nextActions.push("run npm run mac-mini:caddy:dry-run, then after approval install Caddy with bash ops/caddy-install.sh --execute");
    nextActions.push("after Caddy is installed, run npm run mac-mini:caddy-service:dry-run, then after approval install the Caddyfile and restart Caddy with ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute");
  }
  if (!input.launchdLoaded) {
    blockers.push(`launchd service ${input.launchdLabel} is not loaded`);
    nextActions.push("run npm run mac-mini:install:dry-run, then after env/deploy approval install and bootstrap the launchd service");
  }
  if (!input.systemSleepDisabled) {
    blockers.push("system sleep is not disabled for server runtime");
    nextActions.push("after approval, disable system sleep for the Mac mini server runtime");
  }

  if (!input.expectedDnsARecords.some((expected) => input.dnsARecords.includes(expected))) {
    blockers.push("domain DNS A record does not point to the Mac mini public endpoint");
    nextActions.push("keep DNS on Vercel until local 80/443 and router forwarding pass, then update the Porkbun A record to the Mac mini public endpoint");
  }

  for (const port of [80, 443]) {
    const status = input.ports.find((candidate) => candidate.port === port);
    if (!status?.listening) {
      blockers.push(`port ${port} is not listening locally`);
      nextActions.push(`start or repair the local reverse proxy so port ${port} listens before router/DNS cutover`);
    }
  }

  const appPort = input.ports.find((candidate) => candidate.port === 5173);
  if (!appPort?.listening) warnings.push("app port 5173 is not listening locally");

  if (input.currentRuntimeBackend === "memory") {
    blockers.push("current production runtime is memory-backed, not live Supabase/Postgres");
    nextActions.push("switch the runtime to Supabase/Postgres and verify with live acceptance before public cutover");
  }

  return {
    ok: blockers.length === 0,
    mode: "mac-mini-self-host",
    blockers,
    warnings,
    nextActions: [...new Set(nextActions)],
    facts: {
      hostname: input.hostname,
      os: input.os,
      localIp: input.localIp,
      publicIp: input.publicIp,
      envFilePath: input.envFilePath,
      envFileExists: input.envFileExists,
      caddyInstalled: input.caddyInstalled,
      launchdLabel: input.launchdLabel,
      launchdLoaded: input.launchdLoaded,
      systemSleepDisabled: input.systemSleepDisabled,
      dnsARecords: input.dnsARecords,
      ports: input.ports,
      currentRuntimeBackend: input.currentRuntimeBackend
    }
  };
}

async function fetchRuntimeBackend() {
  try {
    const response = await fetch(`https://${domain}/api/health`, { signal: AbortSignal.timeout(probeTimeoutMs) });
    if (!response.ok) return undefined;
    const json = await response.json();
    return json?.db?.backend;
  } catch {
    return undefined;
  }
}

const hostname = run("hostname", []) || "unknown";
const productName = run("sw_vers", ["-productName"]);
const productVersion = run("sw_vers", ["-productVersion"]);
const os = [productName, productVersion].filter(Boolean).join(" ") || "unknown";
const localIp = run("ipconfig", ["getifaddr", "en0"]) || undefined;
const publicIp = run("curl", ["-4", "-fsS", "--max-time", "10", "https://ifconfig.me"]) || undefined;
const dnsARecords = run("dig", ["+short", domain, "A"]).split(/\s+/).filter(Boolean);
const expectedDnsARecords = publicIp ? [publicIp] : [];
const currentRuntimeBackend = await fetchRuntimeBackend();
const envFileExists = commandSucceeds("test", ["-f", envFilePath]);
const caddyInstalled = commandSucceeds("sh", ["-lc", "command -v caddy >/dev/null"]);
const launchdLoaded = commandSucceeds("launchctl", ["print", `gui/${process.getuid()}/${launchdLabel}`]);
const sleepDisabled = systemSleepDisabled();

const report = evaluateMacMiniHostReadiness({
  hostname,
  os,
  localIp,
  publicIp,
  envFilePath,
  envFileExists,
  caddyInstalled,
  launchdLabel,
  launchdLoaded,
  systemSleepDisabled: sleepDisabled,
  expectedLocalIp,
  dnsARecords,
  expectedDnsARecords,
  ports: [80, 443, 5173].map((port) => ({ port, listening: isListening(port) })),
  currentRuntimeBackend
});

console.log(JSON.stringify({ domain, ...report }, null, 2));
process.exit(report.ok ? 0 : 1);
