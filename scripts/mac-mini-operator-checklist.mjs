import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env");

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error(`${[command, ...commandArgs].join(" ")} did not return parseable JSON`);
  }
  return JSON.parse(match[0]);
}

function commandLine(value) {
  return value ? `\`${value}\`` : "`manual step - no repository command`";
}

function checkbox(done) {
  return done ? "[x]" : "[ ]";
}

const handoff = runJson("npm", ["run", "mac-mini:handoff"]);
const nextActionArgs = ["run", "mac-mini:next-action"];
if (preparedEnvPath) nextActionArgs.push("--", "--prepared-env", preparedEnvPath);
const nextAction = runJson("npm", nextActionArgs);

const approvalSteps = Array.isArray(handoff.approvalSteps) ? handoff.approvalSteps : [];
const hardBlockers = Array.isArray(handoff.hardBlockers) ? handoff.hardBlockers : [];
const warnings = Array.isArray(handoff.warnings) ? handoff.warnings : [];
const expectedPending = Array.isArray(handoff.expectedPending) ? handoff.expectedPending : [];

const lines = [
  "# Mac Mini Operator Checklist",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Target: ${handoff.target || "mac-mini-self-host"}`,
  `Domain: ${handoff.domain || "alatau-service.com"}`,
  `Decision: ${handoff.decision || "unknown"}`,
  `Overall: ${handoff.ok ? "ready" : "not ready"}`,
  "",
  "## First Next Action",
  "",
  `- ID: ${nextAction.nextAction?.id || "inspect-handoff"}`,
  `- Reason: ${nextAction.nextAction?.reason || "unknown"}`,
  `- Guide: ${commandLine(nextAction.nextAction?.guide)}`,
  `- Fill command: ${commandLine(nextAction.nextAction?.fillCommand)}`,
  `- Post-fill gate: ${commandLine(nextAction.nextAction?.postfillGate)}`,
  `- Dry-run: ${commandLine(nextAction.nextAction?.dryRun)}`,
  `- Approval: ${commandLine(nextAction.nextAction?.approvalStep?.command)}`,
  "",
  "## Approval Steps",
  ""
];

for (const step of approvalSteps) {
  const isNext = step.id === nextAction.nextAction?.approvalStep?.id;
  lines.push(`- ${checkbox(false)} ${step.id} ${step.label}`);
  lines.push(`  Safety: ${step.safety || "unknown"}`);
  lines.push(`  Command: ${commandLine(step.command)}`);
  if (isNext) lines.push("  Current priority: yes");
}

lines.push("");
lines.push("## Hard Blockers");
lines.push("");
if (hardBlockers.length === 0) {
  lines.push("- none");
} else {
  for (const blocker of hardBlockers) lines.push(`- ${blocker}`);
}

lines.push("");
lines.push("## Expected Pending Before DNS");
lines.push("");
if (expectedPending.length === 0) {
  lines.push("- none");
} else {
  for (const item of expectedPending) lines.push(`- ${item}`);
}

lines.push("");
lines.push("## Warnings");
lines.push("");
if (warnings.length === 0) {
  lines.push("- none");
} else {
  for (const warning of warnings) lines.push(`- ${warning}`);
}

lines.push("");
lines.push("## Safety");
lines.push("");
lines.push("- Read-only: yes");
lines.push("- Secrets printed: no");
lines.push("- Host/DNS/router mutations performed: no");
lines.push("");

const report = `${lines.join("\n")}\n`;
if (outPath) writeOwnerOnlyFile(outPath, report);
console.log(report);
