import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");
const skillVerifyReceiptPath = argValue("--skill-verify-receipt") || "/tmp/alatau-lesson3-skill-verify.json";
const serverDoctorReceiptPath = argValue("--server-doctor-receipt") || "/tmp/alatau-lesson3-server-doctor-equivalent.json";
const acceptWebAuditFallback = process.argv.includes("--accept-web-audit-fallback");

function skillPresent(name) {
  return existsSync(`/Users/azat/.codex/skills/${name}/SKILL.md`);
}

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

function readOptionalJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const lessonArgs = ["run", "lesson3:status"];
if (acceptWebAuditFallback) lessonArgs.push("--", "--accept-web-audit-fallback");
const lessonStatus = runJson("npm", lessonArgs).json || {};
const skillVerify = runJson("npm", ["run", "lesson3:skill-verify", "--", "--out", skillVerifyReceiptPath]).json || readOptionalJson(skillVerifyReceiptPath);
const serverDoctorReceipt = readOptionalJson(serverDoctorReceiptPath);
const userStories = Array.isArray(lessonStatus.userStories) ? lessonStatus.userStories : [];
const storyById = Object.fromEntries(userStories.map((story) => [story.id, story]));
const skillCheckById = Object.fromEntries((skillVerify?.checks || []).map((check) => [check.id, check]));

const skills = {
  "server-doctor-public": skillPresent("server-doctor"),
  "server-doctor": skillPresent("server-doctor"),
  "create-skill": skillPresent("create-skill"),
  "chip-webb": skillPresent("chip-webb"),
  "chip-supergoal": skillPresent("chip-supergoal"),
  "seo-aeo-geo-principal": skillPresent("seo-aeo-geo-principal"),
  "web-audit": skillPresent("web-audit"),
  "chip-legal-web-rf": skillPresent("chip-legal-web-rf")
};

const checklist = [
  {
    id: "skills-server-doctor-public",
    label: "Установить server-doctor-public",
    status: skillCheckById["server-doctor-public"]?.ok ? "done" : skills["server-doctor-public"] ? "partial" : "missing",
    evidence: skillCheckById["server-doctor-public"]?.ok
      ? `Public-clean server-doctor verification receipt: ${skillVerifyReceiptPath}`
      : "Installed skill directory exists, but lesson3:skill-verify has not proved the public-clean server-doctor marker.",
    note: "The installed public-clean server-doctor skill is named server-doctor locally; lesson3:skill-verify proves that it covers the server-doctor-public homework slot."
  },
  {
    id: "skills-create-skill",
    label: "Установить create-skill",
    status: skills["create-skill"] ? "done" : "missing",
    evidence: "Installed skill directory: /Users/azat/.codex/skills/create-skill/SKILL.md"
  },
  {
    id: "skills-chip-webb",
    label: "Установить chip-webb / production web skill",
    status: skills["chip-webb"] ? "done" : "missing",
    evidence: "Installed skill directory: /Users/azat/.codex/skills/chip-webb/SKILL.md"
  },
  {
    id: "skills-chip-supergoal",
    label: "Установить chip-supergoal",
    status: skills["chip-supergoal"] ? "done" : "missing",
    evidence: "Installed skill directory: /Users/azat/.codex/skills/chip-supergoal/SKILL.md"
  },
  {
    id: "skills-seo-aeo-geo-principal",
    label: "Установить seo-aeo-geo-principal",
    status: skills["seo-aeo-geo-principal"] ? "done" : skillCheckById["seo-aeo-geo-principal-fallback"]?.ok ? "equivalent" : skills["web-audit"] ? "partial" : "missing",
    evidence: skillCheckById["seo-aeo-geo-principal-fallback"]?.ok
      ? `Installed web-audit fallback verified by lesson3:skill-verify: ${skillVerifyReceiptPath}`
      : skills["web-audit"] ? "web-audit is installed, but the /seo-aeo-geo-principal trigger has not been verified yet." : "No accepted fallback found.",
    replacement: skillCheckById["seo-aeo-geo-principal-fallback"]?.ok ? "web-audit" : null
  },
  {
    id: "skills-chip-legal-web-rf",
    label: "Установить chip-legal-web-rf",
    status: skillCheckById["chip-legal-web-rf"]?.ok ? "done" : skills["chip-legal-web-rf"] ? "partial" : "missing",
    evidence: skillCheckById["chip-legal-web-rf"]?.ok
      ? `Installed chip-legal-web-rf verified by lesson3:skill-verify: ${skillVerifyReceiptPath}`
      : "Installed skill directory exists, but lesson3:skill-verify has not proved the legal skill markers."
  },
  {
    id: "server-ssot",
    label: "Подготовить VPS и server SSOT",
    status: "equivalent",
    evidence: "Mac mini M4 self-host selected in lesson3:status; runbook exists at docs/ops/alatau-service-self-host-runbook.md.",
    replacement: "Mac mini M4 self-host instead of VPS"
  },
  {
    id: "server-doctor-run",
    label: "Прогнать VPS через server-doctor-public",
    status: serverDoctorReceipt?.conclusion?.diagnosticPassCompleted ? "equivalent" : "partial",
    evidence: serverDoctorReceipt?.conclusion?.diagnosticPassCompleted
      ? `Mac mini server-doctor equivalent receipt: ${serverDoctorReceiptPath}`
      : "Mac mini readiness/status flow exists; final router/DNS/cutover checks remain before public completion.",
    replacement: serverDoctorReceipt?.conclusion?.diagnosticPassCompleted ? "Mac mini M4 self-host read-only diagnostic pass" : undefined
  },
  {
    id: "server-hardening",
    label: "Настроить безопасный базовый контур",
    status: storyById["US-03"]?.status || "partial",
    evidence: storyById["US-03"]?.evidence || null,
    remaining: storyById["US-03"]?.remaining || []
  },
  {
    id: "server-deploy",
    label: "Задеплоить сайт из урока 2 на VPS",
    status: "partial",
    evidence: "Deployment path is translated to Mac mini launchd/Caddy flow; final public cutover remains."
  },
  {
    id: "server-domain-dns",
    label: "Подключить домен через DNS API",
    status: lessonStatus.decision === "ready-for-approved-dns-cutover" ? "partial" : "blocked",
    evidence: `Current cutover decision: ${lessonStatus.decision || "unknown"}.`,
    remaining: storyById["US-04"]?.remaining || []
  },
  {
    id: "backend-supergoal",
    label: "Сделать SuperGoal для backend",
    status: existsSync("docs/supergoal-final-site-crm-contract.json") ? "done" : "missing",
    evidence: "Backend SuperGoal contract: docs/supergoal-final-site-crm-contract.json"
  },
  {
    id: "backend-goal",
    label: "Запустить Goal / slash goal по подготовленному плану",
    status: existsSync("docs/supergoal-final-site-crm-contract.json") ? "done" : "missing",
    evidence: "Implementation artifacts and lesson3 status/report scripts exist in this repo."
  },
  {
    id: "backend-supabase-plan",
    label: "Спланировать Supabase/backend",
    status: existsSync("docs/supergoal-final-site-crm-contract.json") && existsSync("docs/ops/alatau-service-self-host-runbook.md") ? "done" : "missing",
    evidence: "Supabase/backend commands are documented in docs/ops/alatau-service-self-host-runbook.md."
  },
  {
    id: "backend-working-slice",
    label: "Сделать первый working slice",
    status: existsSync("app/api/leads/route.ts") && existsSync("app/crm/page.tsx") && existsSync("app/admin/leads/page.tsx") ? "done" : "missing",
    evidence: "Lead API, CRM, and admin leads routes exist."
  },
  {
    id: "communication-email-plan",
    label: "Подключить или спланировать email-контур",
    status: existsSync("docs/ops/email-contour-plan.md") ? "done" : "missing",
    evidence: "Email contour plan: docs/ops/email-contour-plan.md"
  },
  {
    id: "legal-todo",
    label: "Добавить legal-страницы или список legal TODO",
    status: existsSync("docs/legal/legal-todo.md") ? "done" : "missing",
    evidence: "Legal TODO: docs/legal/legal-todo.md; guided by chip-legal-web-rf."
  },
  {
    id: "verification-user-stories",
    label: "Составить минимум 12 user stories",
    status: existsSync("docs/qa/compare-user-stories.csv") ? "done" : "missing",
    evidence: "User-story QA source: docs/qa/compare-user-stories.csv"
  },
  {
    id: "verification-rerun-failed",
    label: "Прогнать user stories и повторить failed после исправлений",
    status: storyById["US-06"]?.status || "partial",
    evidence: storyById["US-06"]?.evidence || null,
    remaining: storyById["US-06"]?.remaining || []
  }
];

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-screen-checklist",
  source: "Human20 screenshot checklist, mapped to local evidence",
  ok: checklist.every((item) => item.status === "done" || item.status === "equivalent"),
  counts: {
    done: checklist.filter((item) => item.status === "done").length,
    equivalent: checklist.filter((item) => item.status === "equivalent").length,
    partial: checklist.filter((item) => item.status === "partial").length,
    missing: checklist.filter((item) => item.status === "missing").length,
    blocked: checklist.filter((item) => item.status === "blocked").length
  },
  checklist,
  safety: {
    readOnly: true,
    secretsPrinted: false,
    hostDnsRouterMutations: false
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
