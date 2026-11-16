import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out") || "/tmp/alatau-lesson3-server-doctor-equivalent.json";

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8", timeout: 180000 });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  let json = null;
  if (match) {
    try {
      json = JSON.parse(match[0]);
    } catch {
      json = null;
    }
  }
  return {
    command: [command, ...commandArgs].join(" "),
    ok: result.status === 0,
    status: result.status,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    json
  };
}

const status = runJson("npm", ["run", "mac-mini:status"]);
const networkProbe = runJson("npm", ["run", "mac-mini:network-probe"]);
const securityAudit = runJson("npm", ["run", "mac-mini:security-audit"]);

const statusJson = status.json || {};
const networkJson = networkProbe.json || {};
const securityJson = securityAudit.json || {};
const statusBlockers = Array.isArray(statusJson.blockers) ? statusJson.blockers : [];
const securityWarnings = Array.isArray(securityJson.warnings) ? securityJson.warnings : [];

const receipt = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-server-doctor-equivalent",
  originalHomeworkItem: "Прогнать VPS через server-doctor-public",
  equivalent: "Mac mini M4 self-host",
  method: "server-doctor-public equivalent pass using Mac mini read-only status probes",
  commands: {
    status: {
      command: status.command,
      ok: status.ok,
      exitStatus: status.status,
      blockerCount: statusBlockers.length,
      summary: statusJson.summary || null
    },
    networkProbe: {
      command: networkProbe.command,
      ok: networkProbe.ok,
      exitStatus: networkProbe.status,
      publicIp: networkJson.publicIp || null,
      dnsRecords: networkJson.dnsRecords || null,
      warnings: networkJson.warnings || []
    },
    securityAudit: {
      command: securityAudit.command,
      ok: securityAudit.ok,
      exitStatus: securityAudit.status,
      warningCount: securityWarnings.length,
      warnings: securityWarnings
    }
  },
  conclusion: {
    diagnosticPassCompleted: Boolean(status.json && networkProbe.json && securityAudit.json),
    productionCutoverCompleted: false,
    remainingCutoverWork: [
      "approved macOS firewall/launchd/Caddy mutations",
      "router forwarding for 80/443",
      "DNS A record cutover",
      "post-cutover live acceptance"
    ]
  },
  safety: {
    readOnly: true,
    secretsPrinted: false,
    hostDnsRouterMutations: false
  }
};

writeOwnerOnlyFile(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(receipt.conclusion.diagnosticPassCompleted ? 0 : 1);
