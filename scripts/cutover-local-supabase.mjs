import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { argValue, loadEnvFile } from "./env-file.mjs";

const envFile = argValue("--env-file");
const dryRun = process.argv.includes("--dry-run");
if (!envFile) {
  console.log(JSON.stringify({
    ok: false,
    blocker: "missing --env-file",
    note: "Current localhost server was not touched."
  }, null, 2));
  process.exit(2);
}

const fileEnv = loadEnvFile(envFile);
const port = process.env.PORT || fileEnv.PORT || "5173";
const env = {
  ...process.env,
  ...fileEnv,
  DATA_BACKEND: process.env.DATA_BACKEND || fileEnv.DATA_BACKEND || "supabase",
  PORT: port
};
const preflightScript = env.DATA_BACKEND === "postgres"
  ? "scripts/postgres-runtime-preflight.mjs"
  : "scripts/supabase-runtime-preflight.mjs";

function cutoverPlan() {
  return {
    ok: true,
    dryRun,
    mode: env.DATA_BACKEND,
    port,
    envFile,
    preflightScript,
    note: dryRun ? "Dry run only. Current localhost server was not touched." : undefined,
    steps: [
      { label: "apply Supabase migrations", command: `node scripts/apply-supabase-migrations.mjs --env-file ${envFile}`, destructive: false, skipped: false },
      { label: "verify data runtime", command: `node ${preflightScript} --env-file ${envFile}`, destructive: false, skipped: false },
      { label: "build app", command: "npm run build", destructive: false, skipped: false },
      { label: "prepare standalone", command: "npm run prepare:standalone", destructive: false, skipped: false },
      { label: "inspect current listener", command: `lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, destructive: false, skipped: false },
      { label: "stop existing listener", command: `kill <listener-on-${port}>`, destructive: true, skipped: dryRun },
      { label: "write cutover receipt", command: "write .runtime/last-cutover.json", destructive: true, skipped: dryRun },
      { label: "start standalone server", command: "node .next/standalone/server.js", destructive: true, skipped: dryRun }
    ]
  };
}

if (dryRun) {
  console.log(JSON.stringify(cutoverPlan(), null, 2));
  process.exit(0);
}

function run(label, command, args, options = {}) {
  console.log(`[cutover] ${label}`);
  const result = spawnSync(command, args, { env, stdio: options.stdio || "inherit" });
  if (result.status !== 0) {
    console.log(JSON.stringify({ ok: false, failedStep: label, exitCode: result.status }, null, 2));
    process.exit(result.status ?? 1);
  }
  return result;
}

function listenerPids() {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0 && result.status !== 1) {
    throw new Error("failed to inspect port listener");
  }
  return result.stdout
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((pid) => pid !== String(process.pid));
}

run("apply Supabase migrations", "node", ["scripts/apply-supabase-migrations.mjs", "--env-file", envFile]);
run("verify data runtime", "node", [preflightScript, "--env-file", envFile]);
run("build app", "npm", ["run", "build"]);
run("prepare standalone", "npm", ["run", "prepare:standalone"]);

const pids = listenerPids();
for (const pid of pids) {
  console.log(`[cutover] stopping existing listener on ${port}: pid ${pid}`);
  spawnSync("kill", [pid], { stdio: "inherit" });
}

mkdirSync(".runtime", { recursive: true });
writeFileSync(join(".runtime", "last-cutover.json"), JSON.stringify({
  mode: "supabase",
  backend: env.DATA_BACKEND,
  port,
  envFile,
  at: new Date().toISOString()
}, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  mode: env.DATA_BACKEND,
  port,
  next: `node .next/standalone/server.js is starting on ${port}`
}, null, 2));

const server = spawnSync("node", [".next/standalone/server.js"], { env, stdio: "inherit" });
process.exit(server.status ?? 1);
