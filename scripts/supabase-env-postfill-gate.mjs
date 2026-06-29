import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const envFile = argValue("--file") || "/tmp/alatau-supabase.env.todo";
const targetFile = argValue("--target") || "/Users/azat/.codex/secrets/alatau-supabase.env";
const outPath = argValue("--out");

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    return {
      ok: false,
      status: result.status,
      parseError: "command did not return parseable JSON",
      stderr: result.stderr.trim()
    };
  }
  return JSON.parse(match[0]);
}

const audit = runJson("npm", ["run", "supabase:env-audit", "--", "--file", envFile]);
const report = {
  generatedAt: new Date().toISOString(),
  target: "supabase-env-postfill-gate",
  ok: Boolean(audit.ok),
  envFile,
  installTarget: targetFile,
  audit: {
    ok: Boolean(audit.ok),
    blockers: Array.isArray(audit.blockers) ? audit.blockers : [],
    keys: Array.isArray(audit.keys)
      ? audit.keys.map((key) => ({
          name: key.name,
          configured: Boolean(key.configured),
          placeholder: Boolean(key.placeholder)
        }))
      : []
  },
  nextActions: audit.ok
    ? [
        `npm run supabase:env-install:dry-run -- --source ${envFile} --target ${targetFile}`,
        `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source ${envFile} --target ${targetFile}`,
        `npm run supabase:readiness -- --base-url http://127.0.0.1:5173 --runtime-env-file ${targetFile} --out /tmp/alatau-readiness.json`,
        `npm run supabase:preflight -- --runtime-env-file ${targetFile}`
      ]
    : [
        `npm run supabase:env-fill-interactive -- --file ${envFile}`,
        `npm run supabase:env-fill-guide -- --file ${envFile} --out /tmp/alatau-supabase-env-fill-guide.md`,
        `npm run supabase:env-audit -- --file ${envFile}`
      ],
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
