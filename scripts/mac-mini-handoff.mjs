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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const status = runJson("status", "npm", ["run", "mac-mini:status"]);
const gate = runJson("cutover-gate", "npm", ["run", "mac-mini:cutover-gate"]);
const plan = runJson("plan", "npm", ["run", "mac-mini:plan"]);

const approvalSteps = Array.isArray(plan.json?.steps)
  ? plan.json.steps.filter((step) => step.requiresApproval).map((step) => ({
      id: step.id,
      label: step.label,
      safety: step.safety,
      command: step.command
    }))
  : [];

const handoff = {
  generatedAt: new Date().toISOString(),
  target: "mac-mini-self-host",
  domain: "alatau-service.com",
  decision: gate.json?.decision || "unknown",
  ok: Boolean(gate.json?.ok),
  summary: {
    envAudit: Boolean(status.json?.summary?.envAudit),
    hostReadiness: Boolean(status.json?.summary?.hostReadiness),
    networkProbe: Boolean(status.json?.summary?.networkProbe),
    securityAudit: Boolean(status.json?.summary?.securityAudit),
    templates: Boolean(status.json?.summary?.templates),
    planGenerated: Boolean(status.json?.summary?.planGenerated),
    cutoverGate: Boolean(gate.json?.ok)
  },
  hardBlockers: Array.isArray(gate.json?.hardBlockers) ? gate.json.hardBlockers : [],
  expectedPending: Array.isArray(gate.json?.expectedPending) ? gate.json.expectedPending : [],
  warnings: unique([
    ...(Array.isArray(status.json?.warnings) ? status.json.warnings : []),
    ...(Array.isArray(gate.json?.warnings) ? gate.json.warnings : [])
  ]),
  nextActions: unique([
    ...(Array.isArray(gate.json?.nextActions) ? gate.json.nextActions : []),
    ...(Array.isArray(status.json?.nextActions) ? status.json.nextActions : [])
  ]),
  approvalSteps,
  artifacts: {
    statusReport: "npm run mac-mini:status -- --out /tmp/alatau-mac-mini-status.json",
    handoffReport: "npm run mac-mini:handoff -- --out /tmp/alatau-mac-mini-handoff.json",
    postCutoverReport: "ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json"
  },
  checks: [
    { label: status.label, command: status.command, status: status.status, parsed: Boolean(status.json) },
    { label: gate.label, command: gate.command, status: gate.status, parsed: Boolean(gate.json) },
    { label: plan.label, command: plan.command, status: plan.status, parsed: Boolean(plan.json) }
  ]
};

const serialized = JSON.stringify(handoff, null, 2);
if (outPath) {
  writeOwnerOnlyFile(outPath, `${serialized}\n`);
}
console.log(serialized);
process.exit(handoff.ok ? 0 : 1);
