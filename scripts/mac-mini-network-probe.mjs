import net from "node:net";
import { spawnSync } from "node:child_process";
import { argValue } from "./env-file.mjs";

const domain = argValue("--domain") || "alatau-service.com";
const expectedLocalIp = argValue("--expected-local-ip") || "192.168.8.12";
const timeoutMs = Number(argValue("--timeout-ms") || "3000");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8", timeout: timeoutMs });
  return result.status === 0 ? result.stdout.trim() : "";
}

function isListening(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8", timeout: timeoutMs });
  return result.status === 0 && result.stdout.trim().length > 0;
}

function tcpProbe(host, port) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = net.createConnection({ host, port, timeout: timeoutMs });
    const finish = (reachable, error) => {
      socket.destroy();
      resolve({
        host,
        port,
        reachable,
        durationMs: Date.now() - startedAt,
        error
      });
    };

    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false, "timeout"));
    socket.once("error", (error) => finish(false, error.code || error.message));
  });
}

const localIp = run("ipconfig", ["getifaddr", "en0"]) || undefined;
const publicIp = run("curl", ["-4", "-fsS", "--max-time", "10", "https://ifconfig.me"]) || undefined;
const dnsARecords = run("dig", ["+short", domain, "A"]).split(/\s+/).filter(Boolean);
const localPorts = [80, 443, 5173].map((port) => ({ port, listening: isListening(port) }));
const publicPorts = publicIp ? await Promise.all([80, 443].map((port) => tcpProbe(publicIp, port))) : [];

const blockers = [];
const warnings = [];
const nextActions = [];

if (!localIp) {
  blockers.push("local IPv4 address is missing");
  nextActions.push("verify Mac mini network connectivity before router forwarding");
} else if (localIp !== expectedLocalIp) {
  blockers.push(`local IPv4 is ${localIp}, expected reserved ${expectedLocalIp}`);
  nextActions.push(`reserve or set the Mac mini LAN IPv4 to ${expectedLocalIp}`);
}

for (const port of [80, 443]) {
  const local = localPorts.find((entry) => entry.port === port);
  if (!local?.listening) {
    blockers.push(`local port ${port} is not listening`);
    nextActions.push(`start Caddy or another approved reverse proxy on local port ${port}`);
  }
}

const appPort = localPorts.find((entry) => entry.port === 5173);
if (!appPort?.listening) {
  warnings.push("local app port 5173 is not listening");
}

if (!publicIp) {
  warnings.push("public IPv4 was not detected");
} else {
  for (const probe of publicPorts) {
    if (!probe.reachable) {
      warnings.push(`public TCP probe to ${publicIp}:${probe.port} failed (${probe.error || "unreachable"}); NAT hairpin can be unreliable, so verify router forwarding from an external network`);
    }
  }
}

if (publicIp && !dnsARecords.includes(publicIp)) {
  warnings.push("domain DNS A record does not point to the current public IPv4 yet");
}

console.log(JSON.stringify({
  ok: blockers.length === 0,
  domain,
  expectedLocalIp,
  localIp,
  publicIp,
  dnsARecords,
  localPorts,
  publicPorts,
  blockers,
  warnings,
  nextActions: [...new Set(nextActions)]
}, null, 2));

process.exit(blockers.length === 0 ? 0 : 1);
