import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env") || "/tmp/alatau-supabase.env.todo";

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    return {
      ok: false,
      status: result.status,
      parseError: "command did not return parseable JSON",
      stderr: result.stderr.trim()
    };
  }
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return {
      ok: false,
      status: result.status,
      parseError: error instanceof Error ? error.message : "unknown JSON parse error",
      stderr: result.stderr.trim()
    };
  }
}

const handoff = runJson("npm", ["run", "mac-mini:handoff"]);
const preparedEnvAudit = existsSync(preparedEnvPath)
  ? runJson("npm", ["run", "supabase:env-audit", "--", "--file", preparedEnvPath])
  : null;
const fillCommand = `npm run supabase:env-fill-interactive -- --file ${preparedEnvPath}`;

const rules = [
  {
    id: "install-supabase-env",
    match: ["env file not found", "runtime env file is missing"],
    dryRun: "npm run supabase:env-install:dry-run -- --source /path/to/filled-alatau-supabase.env",
    approvalId: "MM-03"
  },
  {
    id: "enable-firewall",
    match: ["macOS application firewall is not enabled"],
    dryRun: "npm run mac-mini:security-hardening:dry-run",
    approvalId: "MM-07"
  },
  {
    id: "install-caddy",
    match: ["Caddy is not installed or not in PATH"],
    dryRun: "npm run mac-mini:caddy:dry-run",
    approvalId: "MM-12"
  },
  {
    id: "bootstrap-launchd",
    match: ["launchd service com.alatau-service.web is not loaded"],
    dryRun: "npm run mac-mini:install:dry-run",
    approvalId: "MM-11"
  },
  {
    id: "start-proxy",
    match: ["local port 80 is not listening", "local port 443 is not listening"],
    dryRun: "npm run mac-mini:caddy-service:dry-run",
    approvalId: "MM-13"
  },
  {
    id: "router-forwarding",
    match: ["public TCP probe"],
    dryRun: "npm run mac-mini:network-probe",
    approvalId: "MM-14"
  },
  {
    id: "dns-cutover",
    match: ["domain DNS A record does not point to the Mac mini public endpoint"],
    dryRun: "npm run mac-mini:dns-cutover:dry-run",
    approvalId: "MM-16"
  },
  {
    id: "post-cutover",
    match: ["current production runtime is memory-backed"],
    dryRun: "npm run mac-mini:post-cutover -- --out /tmp/alatau-post-cutover.json",
    approvalId: "MM-17"
  }
];

const hardBlockers = Array.isArray(handoff.hardBlockers) ? handoff.hardBlockers : [];
const warnings = Array.isArray(handoff.warnings) ? handoff.warnings : [];
const expectedPending = Array.isArray(handoff.expectedPending) ? handoff.expectedPending : [];
const approvalSteps = Array.isArray(handoff.approvalSteps) ? handoff.approvalSteps : [];
const evidence = [...hardBlockers, ...warnings, ...expectedPending];

function findApproval(id) {
  return approvalSteps.find((step) => step.id === id);
}

function chooseRule() {
  const envMissing = evidence.find((item) => item.includes("env file not found") || item.includes("runtime env file is missing"));
  if (envMissing && !preparedEnvAudit) {
    return {
      rule: {
        id: "prepare-supabase-env",
        guide: `npm run supabase:env-prepare -- --out ${preparedEnvPath}`,
        fillCommand,
        postfillGate: `npm run supabase:env-postfill-gate -- --file ${preparedEnvPath} --out /tmp/alatau-supabase-env-postfill.json`,
        dryRun: `npm run supabase:env-fill-guide -- --file ${preparedEnvPath} --out /tmp/alatau-supabase-env-fill-guide.md`,
        approvalId: undefined
      },
      matched: `prepared env file is missing at ${preparedEnvPath}`
    };
  }
  if (envMissing && preparedEnvAudit && !preparedEnvAudit.ok) {
    return {
      rule: {
        id: "fill-prepared-supabase-env",
        guide: `npm run supabase:env-fill-guide -- --file ${preparedEnvPath} --out /tmp/alatau-supabase-env-fill-guide.md`,
        fillCommand,
        postfillGate: `npm run supabase:env-postfill-gate -- --file ${preparedEnvPath} --out /tmp/alatau-supabase-env-postfill.json`,
        dryRun: `npm run supabase:env-audit -- --file ${preparedEnvPath}`,
        approvalId: undefined
      },
      matched: preparedEnvAudit.blockers?.[0] || envMissing
    };
  }
  if (envMissing && preparedEnvAudit?.ok) {
    return {
      rule: {
        id: "install-prepared-supabase-env",
        dryRun: `npm run supabase:env-install:dry-run -- --source ${preparedEnvPath}`,
        approvalId: "MM-03",
        approvalCommand: `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source ${preparedEnvPath} --target /Users/azat/.codex/secrets/alatau-supabase.env`
      },
      matched: envMissing
    };
  }
  for (const rule of rules) {
    const matched = evidence.find((item) => rule.match.some((needle) => item.includes(needle)));
    if (matched) return { rule, matched };
  }
  return null;
}

const selected = chooseRule();
const approval = selected ? findApproval(selected.rule.approvalId) : undefined;
const report = {
  generatedAt: new Date().toISOString(),
  target: "mac-mini-self-host",
  domain: handoff.domain || "alatau-service.com",
  decision: handoff.decision || "unknown",
  ok: Boolean(handoff.ok),
  nextAction: selected
    ? {
        id: selected.rule.id,
        reason: selected.matched,
        guide: selected.rule.guide,
        fillCommand: selected.rule.fillCommand,
        postfillGate: selected.rule.postfillGate,
        dryRun: selected.rule.dryRun,
        approvalStep: approval
          ? {
              id: approval.id,
              label: approval.label,
              safety: approval.safety,
              command: selected.rule.approvalCommand || approval.command
            }
          : undefined
      }
    : {
        id: handoff.ok ? "ready" : "inspect-handoff",
        reason: handoff.ok ? "cutover gate is ready" : "no known priority rule matched current handoff",
        dryRun: "npm run mac-mini:handoff"
      },
  blockerCount: hardBlockers.length,
  warningCount: warnings.length,
  expectedPendingCount: expectedPending.length,
  safety: {
    readOnly: true,
    secretsPrinted: false,
    preparedEnvAudit: preparedEnvAudit
      ? {
          path: preparedEnvPath,
          ok: Boolean(preparedEnvAudit.ok),
          blockers: Array.isArray(preparedEnvAudit.blockers) ? preparedEnvAudit.blockers : []
        }
      : undefined,
    source: "npm run mac-mini:handoff"
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) {
  writeOwnerOnlyFile(outPath, `${serialized}\n`);
}
console.log(serialized);
process.exit(0);
