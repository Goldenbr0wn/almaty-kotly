import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const preparedEnv = argValue("--prepared-env") || "/tmp/alatau-supabase.env.todo";
const outPath = argValue("--out") || "/tmp/alatau-lesson3-bundle.json";
const includeStandaloneSmoke = args.includes("--include-standalone-smoke");
const includeGuardedDryRuns = args.includes("--include-guarded-dry-runs");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");
const commandTimeoutMs = Number(argValue("--command-timeout-ms") || "180000");
const standaloneSmokeArtifact = "/tmp/alatau-standalone-smoke.json";
const guardedDryRunsArtifact = "/tmp/alatau-guarded-dry-run-receipt.json";

const skillGapArgs = ["run", "lesson3:skill-gap", "--", "--out", "/tmp/alatau-lesson3-skill-gap.json"];
if (acceptWebAuditFallback) skillGapArgs.push("--accept-web-audit-fallback");

function lesson3Args(scriptName, artifactPath) {
  const scriptArgs = ["run", scriptName, "--", "--prepared-env", preparedEnv, "--out", artifactPath];
  if (includeStandaloneSmoke) scriptArgs.push("--standalone-smoke", standaloneSmokeArtifact);
  if (includeGuardedDryRuns) scriptArgs.push("--guarded-dry-runs", guardedDryRunsArtifact);
  if (acceptWebAuditFallback) scriptArgs.push("--accept-web-audit-fallback");
  return scriptArgs;
}

const commands = [
  {
    id: "skill-gap",
    artifact: "/tmp/alatau-lesson3-skill-gap.json",
    args: skillGapArgs,
    nonReadyIsExpected: true
  },
  {
    id: "lesson3-report",
    artifact: "/tmp/alatau-lesson3-report.md",
    args: lesson3Args("lesson3:report", "/tmp/alatau-lesson3-report.md"),
    nonReadyIsExpected: true
  },
  {
    id: "lesson3-ru-summary",
    artifact: "/tmp/alatau-lesson3-ru-summary.md",
    args: lesson3Args("lesson3:ru-summary", "/tmp/alatau-lesson3-ru-summary.md"),
    nonReadyIsExpected: true
  },
  {
    id: "lesson3-completion-audit",
    artifact: "/tmp/alatau-lesson3-completion-audit.json",
    args: lesson3Args("lesson3:completion-audit", "/tmp/alatau-lesson3-completion-audit.json"),
    nonReadyIsExpected: true
  },
  {
    id: "supabase-fill-guide",
    artifact: "/tmp/alatau-supabase-env-fill-guide.md",
    args: ["run", "supabase:env-fill-guide", "--", "--file", preparedEnv, "--out", "/tmp/alatau-supabase-env-fill-guide.md"],
    nonReadyIsExpected: true
  },
  {
    id: "supabase-postfill-gate",
    artifact: "/tmp/alatau-supabase-env-postfill.json",
    args: ["run", "supabase:env-postfill-gate", "--", "--file", preparedEnv, "--out", "/tmp/alatau-supabase-env-postfill.json"],
    nonReadyIsExpected: true
  },
  {
    id: "mac-mini-next-action",
    artifact: "/tmp/alatau-mac-mini-next-action.json",
    args: ["run", "mac-mini:next-action", "--", "--prepared-env", preparedEnv, "--out", "/tmp/alatau-mac-mini-next-action.json"],
    nonReadyIsExpected: false
  },
  {
    id: "mac-mini-checklist",
    artifact: "/tmp/alatau-mac-mini-checklist.md",
    args: ["run", "mac-mini:operator-checklist", "--", "--prepared-env", preparedEnv, "--out", "/tmp/alatau-mac-mini-checklist.md"],
    nonReadyIsExpected: false
  },
  {
    id: "mac-mini-status",
    artifact: "/tmp/alatau-mac-mini-status.json",
    args: ["run", "mac-mini:status", "--", "--out", "/tmp/alatau-mac-mini-status.json"],
    nonReadyIsExpected: true
  },
  {
    id: "mac-mini-handoff",
    artifact: "/tmp/alatau-mac-mini-handoff.json",
    args: ["run", "mac-mini:handoff", "--", "--out", "/tmp/alatau-mac-mini-handoff.json"],
    nonReadyIsExpected: true
  }
];

if (includeStandaloneSmoke) {
  commands.splice(1, 0, {
    id: "standalone-smoke",
    artifact: standaloneSmokeArtifact,
    args: ["run", "mac-mini:standalone-smoke", "--", "--out", standaloneSmokeArtifact],
    nonReadyIsExpected: false
  });
}

if (includeGuardedDryRuns) {
  commands.push({
    id: "guarded-dry-runs",
    artifact: guardedDryRunsArtifact,
    args: ["run", "lesson3:guarded-dry-runs", "--", "--prepared-env", preparedEnv, "--out", guardedDryRunsArtifact],
    nonReadyIsExpected: false
  });
}

commands.push({
  id: "lesson3-operator-handoff",
  artifact: "/tmp/alatau-lesson3-operator-handoff.md",
  args: lesson3Args("lesson3:operator-handoff", "/tmp/alatau-lesson3-operator-handoff.md"),
  nonReadyIsExpected: false
});

function runCommand(entry) {
  const result = spawnSync("npm", entry.args, { encoding: "utf8", timeout: commandTimeoutMs });
  return {
    id: entry.id,
    command: ["npm", ...entry.args].join(" "),
    status: result.status,
    timedOut: result.error?.code === "ETIMEDOUT",
    ok: result.status === 0,
    nonReadyIsExpected: entry.nonReadyIsExpected,
    artifact: entry.artifact
  };
}

const results = commands.map(runCommand);
const hardFailures = results.filter((result) => !result.ok && !result.nonReadyIsExpected);
const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-artifact-bundle",
  ok: hardFailures.length === 0,
  overallReady: results.every((result) => result.ok),
  preparedEnv,
  includeStandaloneSmoke,
  includeGuardedDryRuns,
  acceptWebAuditFallback,
  commandTimeoutMs,
  artifacts: Object.fromEntries(results.map((result) => [result.id, result.artifact])),
  results,
  hardFailures,
  safety: {
    readOnly: !includeStandaloneSmoke && !includeGuardedDryRuns,
    secretsPrinted: false,
    installsEnv: false,
    hostDnsRouterMutations: false,
    localBuildArtifactsWritten: includeStandaloneSmoke,
    localLoopbackServerStarted: includeStandaloneSmoke || includeGuardedDryRuns
  }
};

const serialized = JSON.stringify(report, null, 2);
writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
