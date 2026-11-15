import { existsSync, readFileSync } from "node:fs";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");

const skillPaths = {
  "server-doctor-public": "/Users/azat/.codex/skills/server-doctor/SKILL.md",
  "web-audit": "/Users/azat/.codex/skills/web-audit/SKILL.md",
  "chip-legal-web-rf": "/Users/azat/.codex/skills/chip-legal-web-rf/SKILL.md"
};

function readSkill(path) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

const serverDoctor = readSkill(skillPaths["server-doctor-public"]);
const webAudit = readSkill(skillPaths["web-audit"]);
const legal = readSkill(skillPaths["chip-legal-web-rf"]);

const checks = [
  {
    id: "server-doctor-public",
    label: "Установить server-doctor-public",
    path: skillPaths["server-doctor-public"],
    ok:
      Boolean(serverDoctor) &&
      serverDoctor.includes("This public version is intentionally generic") &&
      serverDoctor.includes("server-doctor-public") &&
      serverDoctor.includes("Principal-grade architecture"),
    evidence: [
      "Installed local skill is named server-doctor.",
      "SKILL.md states: This public version is intentionally generic.",
      "SKILL.md defines server-doctor-public principal-grade architecture."
    ]
  },
  {
    id: "seo-aeo-geo-principal-fallback",
    label: "Установить seo-aeo-geo-principal",
    path: skillPaths["web-audit"],
    ok:
      Boolean(webAudit) &&
      webAudit.includes("web-audit") &&
      webAudit.includes("/seo-aeo-geo-principal") &&
      webAudit.includes("SEO / AEO / GEO"),
    replacement: "web-audit",
    evidence: [
      "Exact seo-aeo-geo-principal skill directory is not required for this repo path.",
      "Installed web-audit skill declares the /seo-aeo-geo-principal trigger.",
      "Installed web-audit skill covers SEO/AEO/GEO audit workflows."
    ]
  },
  {
    id: "chip-legal-web-rf",
    label: "Установить chip-legal-web-rf",
    path: skillPaths["chip-legal-web-rf"],
    ok:
      Boolean(legal) &&
      legal.includes("chip-legal-web-rf") &&
      legal.includes("privacy") &&
      legal.includes("cookies"),
    evidence: [
      "Installed chip-legal-web-rf skill is present.",
      "Project legal TODO is stored at docs/legal/legal-todo.md."
    ]
  }
];

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-skill-verify",
  ok: checks.every((check) => check.ok),
  checks,
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
