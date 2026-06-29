import { existsSync, readFileSync } from "node:fs";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");

function skillPath(name) {
  return `/Users/azat/.codex/skills/${name}/SKILL.md`;
}

function skillStatus(name, role) {
  const path = skillPath(name);
  return {
    name,
    role,
    path,
    installed: existsSync(path)
  };
}

function skillHasTrigger(name, trigger) {
  const path = skillPath(name);
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").includes(trigger);
}

const required = [
  skillStatus("create-skill", "required lesson skill"),
  skillStatus("chip-webb", "required lesson skill"),
  skillStatus("seo-aeo-geo-principal", "required lesson skill")
];
const fallback = skillStatus("web-audit", "fallback for SEO/AEO/GEO audit workflows");
const fallbackTrigger = "/seo-aeo-geo-principal";
const fallbackProvidesPrincipalTrigger = skillHasTrigger("web-audit", fallbackTrigger);
const missingRequired = required.filter((skill) => !skill.installed);
const exactSeoInstalled = required.find((skill) => skill.name === "seo-aeo-geo-principal")?.installed === true;
const fallbackAccepted = acceptWebAuditFallback && !exactSeoInstalled && fallback.installed && fallbackProvidesPrincipalTrigger;
const ok = missingRequired.length === 0 || (missingRequired.length === 1 && missingRequired[0].name === "seo-aeo-geo-principal" && fallbackAccepted);

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-skill-gap",
  ok,
  exactRequiredSkillsInstalled: missingRequired.length === 0,
  fallbackAccepted,
  required,
  fallback: {
    ...fallback,
    principalTrigger: fallbackTrigger,
    providesPrincipalTrigger: fallbackProvidesPrincipalTrigger
  },
  missingRequired: missingRequired.map((skill) => skill.name),
  nextActions: ok
    ? []
    : [
        "install the exact seo-aeo-geo-principal skill, or explicitly accept web-audit as the replacement for this lesson"
      ],
  safety: {
    readOnly: true,
    installsSkills: false,
    writesOutsideOutFile: false,
    secretsPrinted: false
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outPath) writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
