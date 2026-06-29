import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env") || "/tmp/alatau-supabase.env.todo";
const standaloneSmokePath = argValue("--standalone-smoke");
const guardedDryRunsPath = argValue("--guarded-dry-runs");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");

function runStatus() {
  const statusArgs = ["run", "lesson3:status", "--", "--prepared-env", preparedEnvPath];
  if (standaloneSmokePath) statusArgs.push("--standalone-smoke", standaloneSmokePath);
  if (guardedDryRunsPath) statusArgs.push("--guarded-dry-runs", guardedDryRunsPath);
  if (acceptWebAuditFallback) statusArgs.push("--accept-web-audit-fallback");
  const result = spawnSync("npm", statusArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    return {
      ok: false,
      status: result.status,
      parseError: "lesson3:status did not return parseable JSON",
      stderr: result.stderr.trim()
    };
  }
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return {
      ok: false,
      status: result.status,
      parseError: error instanceof Error ? error.message : "unknown parse error",
      stderr: result.stderr.trim()
    };
  }
}

function evidenceStatus(story) {
  if (story.status === "done") return "proves-completion";
  if (story.status === "blocked") return "contradicts-completion";
  return "incomplete";
}

function requirementFromStory(story) {
  return {
    id: story.id,
    requirement: story.homeworkItem,
    status: story.status,
    evidenceStatus: evidenceStatus(story),
    evidence: story.evidence || {},
    notes: Array.isArray(story.notes) ? story.notes : [],
    missing: Array.isArray(story.remaining) ? story.remaining : []
  };
}

const status = runStatus();
const requirements = Array.isArray(status.userStories) ? status.userStories.map(requirementFromStory) : [];
const notDone = requirements.filter((requirement) => requirement.status !== "done");
const missingByItem = new Map();
if (status.parseError) {
  missingByItem.set(status.parseError, {
    item: status.parseError,
    requirementIds: ["STATUS-SOURCE"]
  });
}
for (const requirement of requirements) {
  for (const item of requirement.missing) {
    const current = missingByItem.get(item) || { item, requirementIds: [] };
    current.requirementIds.push(requirement.id);
    missingByItem.set(item, current);
  }
}
const completionBlockers = Array.from(missingByItem.values()).map((blocker) => ({
  ...blocker,
  requirementIds: Array.from(new Set(blocker.requirementIds)).sort()
}));
const immediateNextAction = status.nextAction
  ? {
      ...(status.immediateNextAction || status.nextAction),
      completionGateAfterAction: `npm run lesson3:completion-audit -- --prepared-env ${preparedEnvPath}${standaloneSmokePath ? ` --standalone-smoke ${standaloneSmokePath}` : ""}${guardedDryRunsPath ? ` --guarded-dry-runs ${guardedDryRunsPath}` : ""}${acceptWebAuditFallback ? " --accept-web-audit-fallback" : ""} --out /tmp/alatau-lesson3-completion-audit.json`
    }
  : null;

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-completion-audit",
  domain: status.domain || "alatau-service.com",
  preparedEnv: preparedEnvPath,
  acceptWebAuditFallback,
  ok: requirements.length > 0 && notDone.length === 0,
  decision: requirements.length > 0 && notDone.length === 0 ? "complete" : "not-complete",
  auditSource: {
    ok: !status.parseError,
    parseError: status.parseError,
    status: status.status,
    stderr: status.stderr
  },
  nextAction: status.nextAction || null,
  immediateNextAction,
  summary: {
    requirementCount: requirements.length,
    doneCount: requirements.filter((requirement) => requirement.status === "done").length,
    partialCount: requirements.filter((requirement) => requirement.status === "partial").length,
    blockedCount: requirements.filter((requirement) => requirement.status === "blocked").length,
    missingCount: completionBlockers.length
  },
  requirements,
  completionBlockers,
  safety: {
    readOnly: true,
    secretsPrinted: false,
    installsEnv: false,
    hostDnsRouterMutations: false
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
