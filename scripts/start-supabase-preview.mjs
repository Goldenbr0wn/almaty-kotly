import { spawnSync } from "node:child_process";
import { argValue, loadEnvFile } from "./env-file.mjs";

const fileEnv = loadEnvFile(argValue("--env-file"));
const env = {
  ...process.env,
  ...fileEnv,
  DATA_BACKEND: process.env.DATA_BACKEND || fileEnv.DATA_BACKEND || "supabase",
  PORT: process.env.PORT || fileEnv.PORT || "5173"
};

const preflightScript = env.DATA_BACKEND === "postgres"
  ? "scripts/postgres-runtime-preflight.mjs"
  : "scripts/supabase-runtime-preflight.mjs";
const preflight = spawnSync("node", [preflightScript], { env, stdio: "inherit" });
if (preflight.status !== 0) process.exit(preflight.status ?? 1);

for (const args of [
  ["run", "build"],
  ["run", "prepare:standalone"]
]) {
  const result = spawnSync("npm", args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const server = spawnSync("node", [".next/standalone/server.js"], { env, stdio: "inherit" });
process.exit(server.status ?? 1);
