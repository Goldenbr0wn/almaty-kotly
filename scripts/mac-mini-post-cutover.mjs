import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const outPath = argValue("--out");

if (execute && process.env.ALATAU_POST_CUTOVER_CONFIRMED !== "1") {
  console.error("blocked: post-cutover execute requires ALATAU_POST_CUTOVER_CONFIRMED=1");
  process.exit(1);
}

const commands = [
  {
    label: "production-healthcheck",
    command: "bash",
    args: ["ops/healthcheck.sh", "--production"]
  },
  {
    label: "live-runtime-acceptance",
    command: "npm",
    args: [
      "run",
      "runtime:acceptance",
      "--",
      "--base-url=https://alatau-service.com",
      "--require-live-db",
      "--post-lead"
    ],
    writesSmokeLead: true
  }
];

function runCommand(item) {
  const result = spawnSync(item.command, item.args, { encoding: "utf8" });
  let json;
  try {
    const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
    json = match ? JSON.parse(match[0]) : undefined;
  } catch {
    json = undefined;
  }

  return {
    label: item.label,
    command: [item.command, ...item.args].join(" "),
    ok: result.status === 0,
    status: result.status,
    writesSmokeLead: Boolean(item.writesSmokeLead),
    json,
    stdout: json ? undefined : result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

const report = execute
  ? {
      generatedAt: new Date().toISOString(),
      mode: "execute",
      target: "mac-mini-post-cutover",
      domain: "alatau-service.com",
      checks: commands.map(runCommand)
    }
  : {
      generatedAt: new Date().toISOString(),
      mode: "dry-run",
      target: "mac-mini-post-cutover",
      domain: "alatau-service.com",
      checks: commands.map((item) => ({
        label: item.label,
        command: [item.command, ...item.args].join(" "),
        writesSmokeLead: Boolean(item.writesSmokeLead),
        skipped: true
      })),
      nextActions: [
        "rerun with ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json after DNS cutover approval to run production healthcheck and post one smoke lead"
      ]
    };

report.ok = execute ? report.checks.every((check) => check.ok) : false;
report.requiresApproval = !execute;

const serialized = JSON.stringify(report, null, 2);
if (outPath) {
  writeOwnerOnlyFile(outPath, `${serialized}\n`);
}
console.log(serialized);
process.exit(report.ok ? 0 : execute ? 1 : 0);
