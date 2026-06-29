import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env");
const standaloneSmokePath = argValue("--standalone-smoke");
const guardedDryRunsPath = argValue("--guarded-dry-runs");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");

function runStatus() {
  const statusArgs = ["run", "lesson3:status"];
  const statusScriptArgs = [];
  if (preparedEnvPath) statusScriptArgs.push("--prepared-env", preparedEnvPath);
  if (standaloneSmokePath) statusScriptArgs.push("--standalone-smoke", standaloneSmokePath);
  if (guardedDryRunsPath) statusScriptArgs.push("--guarded-dry-runs", guardedDryRunsPath);
  if (acceptWebAuditFallback) statusScriptArgs.push("--accept-web-audit-fallback");
  if (statusScriptArgs.length > 0) statusArgs.push("--", ...statusScriptArgs);
  const result = spawnSync("npm", statusArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error("lesson3:status did not return parseable JSON");
  }
  return JSON.parse(match[0]);
}

function icon(status) {
  if (status === "done") return "[done]";
  if (status === "blocked") return "[blocked]";
  return "[partial]";
}

function list(values) {
  if (!Array.isArray(values) || values.length === 0) return "- none";
  return values.map((value) => `- ${value}`).join("\n");
}

const status = runStatus();
const done = status.userStories.filter((story) => story.status === "done");
const partial = status.userStories.filter((story) => story.status === "partial");
const blocked = status.userStories.filter((story) => story.status === "blocked");
const immediate = status.immediateNextAction || status.nextAction || {};

const lines = [
  "# Lesson 3 Homework Status",
  "",
  `Generated: ${status.generatedAt}`,
  `Domain: ${status.domain}`,
  `Decision: ${status.decision}`,
  `Prepared env: ${status.preparedEnv || "unknown"}`,
  `Overall: ${status.ok ? "ready" : "not ready"}`,
  "",
  "## Summary",
  "",
  `- Done: ${done.length}`,
  `- Partial: ${partial.length}`,
  `- Blocked: ${blocked.length}`,
  status.standaloneSmoke ? `- Standalone smoke: ${status.standaloneSmoke.ok ? "ok" : "not ok"} (${status.standaloneSmoke.backend || "unknown backend"}, ${status.standaloneSmoke.artifact})` : "- Standalone smoke: not included",
  status.guardedDryRuns ? `- Guarded dry-runs: ${status.guardedDryRuns.ok ? "ok" : "not ok"} (${status.guardedDryRuns.checkCount} checks, ${status.guardedDryRuns.expectedBlockCount} expected blocks, ${status.guardedDryRuns.artifact})` : "- Guarded dry-runs: not included",
  "",
  "## Next Action",
  "",
  `- ID: ${immediate.id || "unknown"}`,
  `- Reason: ${immediate.reason || "unknown"}`,
  Array.isArray(immediate.unblocksRequirementIds) && immediate.unblocksRequirementIds.length > 0 ? `- Unblocks: ${immediate.unblocksRequirementIds.join(", ")}` : "- Unblocks: unknown",
  immediate.evidenceSource ? `- Evidence source: ${immediate.evidenceSource}` : "- Evidence source: lesson3:status",
  immediate.guide ? `- Guide: \`${immediate.guide}\`` : "- Guide: none",
  immediate.fillCommand ? `- Fill command: \`${immediate.fillCommand}\`` : "- Fill command: none",
  immediate.postfillGate ? `- Post-fill gate: \`${immediate.postfillGate}\`` : "- Post-fill gate: none",
  `- Dry-run: \`${immediate.dryRun || "npm run lesson3:status"}\``,
  immediate.approvalStep?.command ? `- Approval command: \`${immediate.approvalStep.command}\`` : "- Approval command: none",
  "",
  "## Completion Audit",
  "",
  "- Artifact: `/tmp/alatau-lesson3-completion-audit.json`",
  `- Refresh: \`npm run lesson3:completion-audit -- --prepared-env ${status.preparedEnv || "/tmp/alatau-supabase.env.todo"}${standaloneSmokePath ? ` --standalone-smoke ${standaloneSmokePath}` : ""}${guardedDryRunsPath ? ` --guarded-dry-runs ${guardedDryRunsPath}` : ""}${acceptWebAuditFallback ? " --accept-web-audit-fallback" : ""} --out /tmp/alatau-lesson3-completion-audit.json\``,
  "- Purpose: machine-readable requirement-by-requirement proof before any final done claim",
  "",
  "## User Stories",
  ""
];

for (const story of status.userStories) {
  lines.push(`### ${story.id} ${icon(story.status)} ${story.title}`);
  lines.push("");
  lines.push(`Homework item: ${story.homeworkItem}`);
  lines.push("");
  if (Array.isArray(story.notes) && story.notes.length > 0) {
    lines.push("Notes:");
    lines.push(list(story.notes));
    lines.push("");
  }
  lines.push("Remaining:");
  lines.push(list(story.remaining));
  lines.push("");
}

lines.push("## Safety");
lines.push("");
lines.push(`- Read-only: ${status.safety?.readOnly ? "yes" : "no"}`);
lines.push(`- Secrets printed: ${status.safety?.secretsPrinted ? "yes" : "no"}`);
lines.push("");

const report = `${lines.join("\n")}\n`;
if (outPath) writeOwnerOnlyFile(outPath, report);
console.log(report);
