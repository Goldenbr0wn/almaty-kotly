import { existsSync, readFileSync } from "node:fs";
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
  if (!match) return { ok: false, status: result.status, json: null };
  try {
    return { ok: result.status === 0, status: result.status, json: JSON.parse(match[0]) };
  } catch {
    return { ok: false, status: result.status, json: null };
  }
}

function skillPresent(name) {
  return existsSync(`/Users/azat/.codex/skills/${name}/SKILL.md`);
}

function readOptionalJson(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      ok: false,
      parseError: error instanceof Error ? error.message : "unknown parse error"
    };
  }
}

function statusFrom(ok, blocked) {
  if (ok) return "done";
  if (blocked) return "blocked";
  return "partial";
}

function unblocksForNextAction(nextAction) {
  const id = nextAction?.id || "";
  if (["prepare-supabase-env", "fill-prepared-supabase-env", "install-prepared-supabase-env", "install-supabase-env"].includes(id)) {
    return ["US-05", "US-06", "US-07"];
  }
  if (id.includes("firewall") || id.includes("security")) return ["US-03", "US-07"];
  if (id.includes("caddy") || id.includes("launchd")) return ["US-03", "US-04", "US-07"];
  if (id.includes("dns") || id.includes("router")) return ["US-04", "US-06", "US-07"];
  return [];
}

const handoff = runJson("npm", ["run", "mac-mini:handoff"]).json || {};
const nextAction = runJson("npm", ["run", "mac-mini:next-action", "--", "--prepared-env", preparedEnvPath]).json || {};
const standaloneSmoke = readOptionalJson(standaloneSmokePath);
const guardedDryRuns = readOptionalJson(guardedDryRunsPath);
const skillGapArgs = ["run", "lesson3:skill-gap"];
if (acceptWebAuditFallback) skillGapArgs.push("--", "--accept-web-audit-fallback");
const skillGap = runJson("npm", skillGapArgs).json || {};
const hardBlockers = Array.isArray(handoff.hardBlockers) ? handoff.hardBlockers : [];
const warnings = Array.isArray(handoff.warnings) ? handoff.warnings : [];
const approvalSteps = Array.isArray(handoff.approvalSteps) ? handoff.approvalSteps : [];

const skillEntries = Array.isArray(skillGap.required) ? skillGap.required : [];
const skills = Object.fromEntries(skillEntries.map((skill) => [skill.name, skill.installed]));
skills["web-audit"] = skillGap.fallback?.installed ?? skillPresent("web-audit");

const requiredSkillsInstalled = skillGap.exactRequiredSkillsInstalled === true;
const acceptedSeoFallback = skillGap.fallbackAccepted === true;
const seoFallbackAvailable = !skills["seo-aeo-geo-principal"] && skills["web-audit"];
const seoPrincipalTriggerAvailable = skillGap.fallback?.providesPrincipalTrigger === true;

const userStories = [
  {
    id: "US-01",
    title: "Skills installed",
    homeworkItem: "Install and verify create-skill, chip-webb, and SEO/AEO/GEO principal tooling",
    status: requiredSkillsInstalled || acceptedSeoFallback ? "done" : seoFallbackAvailable ? "partial" : "blocked",
    evidence: {
      ...skills,
      skillGap: acceptWebAuditFallback ? "npm run lesson3:skill-gap -- --accept-web-audit-fallback" : "npm run lesson3:skill-gap",
      fallbackAccepted: acceptedSeoFallback,
      fallbackPrincipalTrigger: seoPrincipalTriggerAvailable ? skillGap.fallback?.principalTrigger : undefined,
      fallback: seoFallbackAvailable ? "web-audit covers SEO/AEO/GEO audit workflows and declares the /seo-aeo-geo-principal trigger, but seo-aeo-geo-principal is not installed as a separate skill directory" : undefined
    },
    remaining: requiredSkillsInstalled || acceptedSeoFallback ? [] : ["install or confirm the exact seo-aeo-geo-principal skill, or explicitly accept web-audit as the replacement"]
  },
  {
    id: "US-02",
    title: "Server selected",
    homeworkItem: "Use an existing server and save access path",
    status: "partial",
    evidence: {
      target: "Mac mini M4 self-host",
      vpsRequired: false,
      accessModel: "local macOS host, launchd service, Caddy reverse proxy",
      handoffTarget: handoff.target,
      nextAction: nextAction.nextAction?.id
    },
    notes: [
      "VPS is intentionally not required because the Mac mini M4 is the selected always-on server."
    ],
    remaining: ["complete approval steps until mac-mini:cutover-gate is ready"]
  },
  {
    id: "US-03",
    title: "Server hardening",
    homeworkItem: "Configure SSH/firewall/fail2ban/Docker/reverse proxy/HTTPS",
    status: statusFrom(false, hardBlockers.some((blocker) => blocker.includes("firewall") || blocker.includes("Caddy") || blocker.includes("launchd") || blocker.includes("port 80") || blocker.includes("port 443"))),
    evidence: {
      blockers: hardBlockers.filter((blocker) => blocker.includes("firewall") || blocker.includes("Caddy") || blocker.includes("launchd") || blocker.includes("port 80") || blocker.includes("port 443")),
      warnings: warnings.filter((warning) => warning.includes("stealth") || warning.includes("remote login")),
      macMiniEquivalents: {
        sshRootAccess: "no VPS root login is required; Remote Login should stay disabled unless key-only SSH is intentionally approved",
        fail2ban: "not required unless public SSH is exposed; macOS firewall/stealth mode and closed SSH are the selected baseline",
        dockerCompose: "not required for this host path; Next.js standalone output is managed by launchd",
        reverseProxyHttps: "Caddy is the approved reverse proxy and HTTPS endpoint"
      }
    },
    notes: [
      "VPS-specific hardening is translated to Mac mini controls: macOS firewall, stealth mode, launchd, Caddy, and no public SSH unless explicitly approved."
    ],
    remaining: approvalSteps.filter((step) => ["MM-07", "MM-11", "MM-12", "MM-13"].includes(step.id)).map((step) => step.label)
  },
  {
    id: "US-04",
    title: "Domain connected",
    homeworkItem: "Connect domain and verify site opens by domain",
    status: handoff.decision === "ready-for-approved-dns-cutover" ? "partial" : "blocked",
    evidence: {
      decision: handoff.decision,
      expectedPending: handoff.expectedPending || []
    },
    remaining: approvalSteps.filter((step) => ["MM-14", "MM-16"].includes(step.id)).map((step) => step.label)
  },
  {
    id: "US-05",
    title: "Backend SuperGoal",
    homeworkItem: "Formulate backend SuperGoal: Supabase, profile, CRM/leads, minimal admin",
    status: existsSync(".supergoal") ? "partial" : "blocked",
    evidence: {
      supergoalPackage: existsSync(".supergoal"),
      backendContract: existsSync("docs/supergoal-final-site-crm-contract.json")
    },
    remaining: hardBlockers.filter((blocker) => blocker.includes("env") || blocker.includes("runtime"))
  },
  {
    id: "US-06",
    title: "User stories checked",
    homeworkItem: "Run product through user stories, test, log bugs, fix and repeat",
    status: "partial",
    evidence: {
      tests: "npm test -- --runInBand",
      runtimeAcceptance: "npm run runtime:acceptance",
      standaloneSmoke: standaloneSmoke
        ? {
            artifact: standaloneSmokePath,
            ok: Boolean(standaloneSmoke.ok),
            generatedAt: standaloneSmoke.generatedAt,
            baseUrl: standaloneSmoke.baseUrl,
            backend: standaloneSmoke.health?.backend,
            acceptanceStatus: standaloneSmoke.acceptance?.status,
            parseError: standaloneSmoke.parseError
          }
        : undefined,
      guardedDryRuns: guardedDryRuns
        ? {
            artifact: guardedDryRunsPath,
            ok: Boolean(guardedDryRuns.ok),
            generatedAt: guardedDryRuns.generatedAt,
            checkCount: Array.isArray(guardedDryRuns.checks) ? guardedDryRuns.checks.length : 0,
            expectedBlockCount: Array.isArray(guardedDryRuns.checks) ? guardedDryRuns.checks.filter((check) => check.expectedBlock).length : 0,
            parseError: guardedDryRuns.parseError
          }
        : undefined,
      nextAction: nextAction.nextAction?.id
    },
    remaining: ["run live acceptance after Supabase env, launchd, proxy, router, and DNS cutover"]
  },
  {
    id: "US-07",
    title: "Final ready state",
    homeworkItem: "Done when server, domain, safe access, published site, skills, and user stories are ready",
    status: handoff.ok ? "done" : "blocked",
    evidence: {
      decision: handoff.decision,
      hardBlockerCount: hardBlockers.length,
      warningCount: warnings.length
    },
    remaining: hardBlockers
  }
];

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-homework",
  domain: handoff.domain || "alatau-service.com",
  ok: userStories.every((story) => story.status === "done"),
  decision: handoff.decision || "unknown",
  preparedEnv: preparedEnvPath,
  standaloneSmoke: standaloneSmoke
    ? {
        artifact: standaloneSmokePath,
        ok: Boolean(standaloneSmoke.ok),
        generatedAt: standaloneSmoke.generatedAt,
        baseUrl: standaloneSmoke.baseUrl,
        backend: standaloneSmoke.health?.backend,
        acceptanceStatus: standaloneSmoke.acceptance?.status,
        parseError: standaloneSmoke.parseError
      }
    : null,
  guardedDryRuns: guardedDryRuns
    ? {
        artifact: guardedDryRunsPath,
        ok: Boolean(guardedDryRuns.ok),
        generatedAt: guardedDryRuns.generatedAt,
        checkCount: Array.isArray(guardedDryRuns.checks) ? guardedDryRuns.checks.length : 0,
        expectedBlockCount: Array.isArray(guardedDryRuns.checks) ? guardedDryRuns.checks.filter((check) => check.expectedBlock).length : 0,
        parseError: guardedDryRuns.parseError
      }
    : null,
  acceptWebAuditFallback,
  nextAction: nextAction.nextAction,
  immediateNextAction: nextAction.nextAction
    ? {
        ...nextAction.nextAction,
        evidenceSource: "lesson3:status -> mac-mini:next-action",
        unblocksRequirementIds: unblocksForNextAction(nextAction.nextAction)
      }
    : null,
  userStories,
  safety: {
    readOnly: true,
    secretsPrinted: false
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
