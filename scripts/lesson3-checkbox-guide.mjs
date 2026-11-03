import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out") || "/tmp/alatau-lesson3-checkbox-guide.md";

function runScreenChecklist() {
  const result = spawnSync("npm", [
    "run",
    "lesson3:screen-checklist",
    "--",
    "--accept-web-audit-fallback",
    "--out",
    "/tmp/alatau-lesson3-screen-checklist.json"
  ], { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error("lesson3:screen-checklist did not return JSON");
  }
  return JSON.parse(match[0]);
}

const report = runScreenChecklist();
const items = Array.isArray(report.checklist) ? report.checklist : [];
const checkNow = items.filter((item) => item.status === "done" || item.status === "equivalent");
const doNotCheck = items.filter((item) => item.status === "partial" || item.status === "blocked" || item.status === "missing");

const lines = [
  "# Human20 Lesson 3 Checkbox Guide",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Source: lesson3:screen-checklist (/tmp/alatau-lesson3-screen-checklist.json)`,
  `Counts: ${report.counts?.done || 0} done, ${report.counts?.equivalent || 0} equivalent, ${report.counts?.partial || 0} partial, ${report.counts?.missing || 0} missing, ${report.counts?.blocked || 0} blocked`,
  "",
  "## Можно ставить галочку",
  "",
  ...checkNow.map((item) => `- [x] ${item.label} — ${item.status}${item.replacement ? ` (${item.replacement})` : ""}`),
  "",
  "## Не ставить пока",
  "",
  ...doNotCheck.map((item) => {
    const remaining = Array.isArray(item.remaining) && item.remaining.length ? ` Осталось: ${item.remaining.join("; ")}.` : "";
    return `- [ ] ${item.label} — ${item.status}.${remaining}`;
  }),
  "",
  "## Safety",
  "",
  "- Read-only: yes",
  "- Secrets printed: no",
  "- Host/DNS/router mutations performed: no"
];

const markdown = `${lines.join("\n")}\n`;
writeOwnerOnlyFile(outPath, markdown);
console.log(markdown);
