import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const envFile = argValue("--file") || "/tmp/alatau-supabase.env.todo";
const outPath = argValue("--out");

const keyGuides = {
  DATA_BACKEND: "Keep `postgres` for direct database writes through `SUPABASE_DB_URL`, or switch to `supabase` only when REST/Auth mode is intended.",
  NEXT_PUBLIC_SITE_URL: "Use the public production URL: `https://alatau-service.com`.",
  ADMIN_EMAILS: "Use the approved admin email list, comma-separated. Do not leave `owner@example.com`.",
  NEXT_PUBLIC_SUPABASE_URL: "Supabase dashboard: Project Settings -> API -> Project URL.",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase dashboard: Project Settings -> API -> anon/public key.",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase dashboard: Project Settings -> API -> service_role key. Treat as highly sensitive.",
  SUPABASE_DB_URL: "Supabase dashboard: Project Settings -> Database -> connection string or pooler URL for migrations/direct writes."
};

function runAudit() {
  const result = spawnSync("npm", ["run", "supabase:env-audit", "--", "--file", envFile], { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error("supabase:env-audit did not return parseable JSON");
  }
  return JSON.parse(match[0]);
}

function statusFor(key) {
  if (!key.configured) return "missing";
  if (key.placeholder) return "placeholder";
  return "configured";
}

const audit = runAudit();
const lines = [
  "# Supabase Env Fill Guide",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Env file: ${envFile}`,
  `Audit status: ${audit.ok ? "ready" : "needs values"}`,
  "",
  "## Required Keys",
  ""
];

for (const key of audit.keys || []) {
  lines.push(`- ${key.name}: ${statusFor(key)}`);
  lines.push(`  Source: ${keyGuides[key.name] || "Use the project secret manager or approved runtime configuration."}`);
}

lines.push("");
lines.push("## Current Blockers");
lines.push("");
if (Array.isArray(audit.blockers) && audit.blockers.length > 0) {
  for (const blocker of audit.blockers) lines.push(`- ${blocker}`);
} else {
  lines.push("- none");
}

lines.push("");
lines.push("## After Filling");
lines.push("");
lines.push(`1. Optional safer local fill: \`npm run supabase:env-fill-interactive -- --file ${envFile}\`.`);
lines.push(`2. Run \`npm run supabase:env-audit -- --file ${envFile}\`.`);
lines.push(`3. Run the post-fill gate: \`npm run supabase:env-postfill-gate -- --file ${envFile} --out /tmp/alatau-supabase-env-postfill.json\`.`);
lines.push("4. If the post-fill gate is green, use the dry-run and guarded install commands it prints.");
lines.push("5. Install only after explicit approval with the guarded command from `npm run mac-mini:next-action`.");
lines.push("");
lines.push("## Safety");
lines.push("");
lines.push("- Values printed: no");
lines.push("- Secrets installed: no");
lines.push("- Host/DNS/router mutations performed: no");
lines.push("");

const guide = `${lines.join("\n")}\n`;
if (outPath) writeOwnerOnlyFile(outPath, guide);
console.log(guide);
