import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");

function runJson(label, command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  let json = null;
  try {
    const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
    json = match ? JSON.parse(match[0]) : null;
  } catch {
    json = null;
  }
  return {
    label,
    command: [command, ...commandArgs].join(" "),
    ok: result.status === 0,
    status: result.status,
    json,
    stderr: result.stderr.trim()
  };
}

const checks = [
  runJson("env-audit", "npm", ["run", "supabase:env-audit", "--", "--file", "/Users/azat/.codex/secrets/alatau-supabase.env"]),
  runJson("host-readiness", "npm", ["run", "mac-mini:readiness"]),
  runJson("network-probe", "npm", ["run", "mac-mini:network-probe"]),
  runJson("security-audit", "npm", ["run", "mac-mini:security-audit"]),
  runJson("templates", "npm", ["run", "mac-mini:templates"]),
  runJson("plan", "npm", ["run", "mac-mini:plan"])
];

const blockers = [];
const warnings = [];
const nextActions = [];
for (const check of checks) {
  if (check.json?.blockers) blockers.push(...check.json.blockers.map((blocker) => `${check.label}: ${blocker}`));
  if (check.json?.warnings) warnings.push(...check.json.warnings.map((warning) => `${check.label}: ${warning}`));
  if (check.json?.nextActions) nextActions.push(...check.json.nextActions.map((action) => `${check.label}: ${action}`));
  if (Array.isArray(check.json?.checks)) {
    for (const item of check.json.checks) {
      if (!item.ok) blockers.push(`${check.label}: ${item.stderr || item.command}`);
    }
  }
  if (!check.ok && !check.json) blockers.push(`${check.label}: command failed with status ${check.status}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  ok: blockers.length === 0,
  target: "mac-mini-self-host",
  domain: "alatau-service.com",
  summary: {
    envAudit: Boolean(checks[0].json?.ok),
    hostReadiness: Boolean(checks[1].json?.ok),
    networkProbe: Boolean(checks[2].json?.ok),
    securityAudit: Boolean(checks[3].json?.ok),
    templates: Boolean(checks[4].json?.ok),
    planGenerated: Boolean(checks[5].json?.steps?.length)
  },
  blockers,
  warnings,
  nextActions,
  checks
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) {
  writeOwnerOnlyFile(outPath, `${serialized}\n`);
}
console.log(serialized);
process.exit(report.ok ? 0 : 1);
