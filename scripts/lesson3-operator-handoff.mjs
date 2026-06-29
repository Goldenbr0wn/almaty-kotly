import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env") || "/tmp/alatau-supabase.env.todo";
const standaloneSmokePath = argValue("--standalone-smoke");
const guardedDryRunsPath = argValue("--guarded-dry-runs");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error(`${[command, ...commandArgs].join(" ")} did not return parseable JSON`);
  }
  return JSON.parse(match[0]);
}

function commandLine(value) {
  return value ? `\`${value}\`` : "`none`";
}

function list(values) {
  if (!Array.isArray(values) || values.length === 0) return "- none";
  return values.map((value) => `- ${value}`).join("\n");
}

const statusArgs = ["run", "lesson3:status", "--", "--prepared-env", preparedEnvPath];
if (standaloneSmokePath) statusArgs.push("--standalone-smoke", standaloneSmokePath);
if (guardedDryRunsPath) statusArgs.push("--guarded-dry-runs", guardedDryRunsPath);
if (acceptWebAuditFallback) statusArgs.push("--accept-web-audit-fallback");

const status = runJson("npm", statusArgs);
const nextAction = status.immediateNextAction || status.nextAction || {};
const blocked = status.userStories.filter((story) => story.status === "blocked");
const partial = status.userStories.filter((story) => story.status === "partial");
const done = status.userStories.filter((story) => story.status === "done");

const afterEnvGate = [
  `npm run supabase:env-install:dry-run -- --source ${preparedEnvPath}`,
  `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source ${preparedEnvPath}`,
  "npm run mac-mini:install:dry-run",
  "npm run mac-mini:caddy:dry-run",
  "npm run mac-mini:security-hardening:dry-run",
  "npm run mac-mini:cutover-gate",
  "npm run mac-mini:dns-cutover:dry-run"
];

const doNotYet = [
  "Do not move DNS while mac-mini:cutover-gate returns do-not-cutover.",
  "Do not install placeholder Supabase env values into the runtime secret store.",
  "Do not open router ports before local 80/443, Caddy, launchd, and firewall checks are intentionally approved.",
  "Do not print, paste, or commit Supabase service-role, anon, DB URL, Porkbun, or admin secrets."
];

const lines = [
  "# Lesson 3 Operator Handoff",
  "",
  `Generated: ${status.generatedAt || new Date().toISOString()}`,
  "Target: Mac mini M4 self-host",
  `Domain: ${status.domain || "alatau-service.com"}`,
  `Decision: ${status.decision || "unknown"}`,
  `Prepared env: ${status.preparedEnv || preparedEnvPath}`,
  `Overall: ${status.ok ? "ready" : "not ready"}`,
  "",
  "## Current Count",
  "",
  `- Done: ${done.length}`,
  `- Partial: ${partial.length}`,
  `- Blocked: ${blocked.length}`,
  status.standaloneSmoke ? `- Standalone smoke: ${status.standaloneSmoke.ok ? "ok" : "not ok"} (${status.standaloneSmoke.artifact})` : "- Standalone smoke: not included",
  status.guardedDryRuns ? `- Guarded dry-runs: ${status.guardedDryRuns.ok ? "ok" : "not ok"} (${status.guardedDryRuns.artifact})` : "- Guarded dry-runs: not included",
  "",
  "## Do Now",
  "",
  `- Action: ${nextAction.id || "inspect-status"}`,
  `- Reason: ${nextAction.reason || "unknown"}`,
  Array.isArray(nextAction.unblocksRequirementIds) && nextAction.unblocksRequirementIds.length > 0 ? `- Unblocks: ${nextAction.unblocksRequirementIds.join(", ")}` : "- Unblocks: unknown",
  `- Guide: ${commandLine(nextAction.guide)}`,
  `- Fill command: ${commandLine(nextAction.fillCommand)}`,
  `- Post-fill gate: ${commandLine(nextAction.postfillGate)}`,
  `- Dry-run/check: ${commandLine(nextAction.dryRun)}`,
  "",
  "## Do Not Yet",
  "",
  list(doNotYet),
  "",
  "## After Env Gate Is Green",
  "",
  list(afterEnvGate.map((command) => `\`${command}\``)),
  "",
  "## Evidence To Refresh Before Claiming Done",
  "",
  `- \`npm run lesson3:bundle -- --prepared-env ${preparedEnvPath} --accept-web-audit-fallback --include-standalone-smoke --include-guarded-dry-runs --out /tmp/alatau-lesson3-bundle-full.json\``,
  "- `npm run lesson3:artifact-audit -- --bundle /tmp/alatau-lesson3-bundle-full.json --out /tmp/alatau-lesson3-artifact-audit-full.json`",
  `- \`npm run lesson3:completion-audit -- --prepared-env ${preparedEnvPath}${standaloneSmokePath ? ` --standalone-smoke ${standaloneSmokePath}` : ""}${guardedDryRunsPath ? ` --guarded-dry-runs ${guardedDryRunsPath}` : ""}${acceptWebAuditFallback ? " --accept-web-audit-fallback" : ""} --out /tmp/alatau-lesson3-completion-audit.json\``,
  "",
  "## Safety",
  "",
  "- Read-only: yes",
  "- Secrets printed: no",
  "- Installs env: no",
  "- Host/DNS/router mutations performed: no",
  ""
];

const report = `${lines.join("\n")}\n`;
if (outPath) writeOwnerOnlyFile(outPath, report);
console.log(report);
