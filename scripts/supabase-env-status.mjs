import { applyEnv, argValue, loadEnvFile } from "./env-file.mjs";

const postgresKeys = ["SUPABASE_DB_URL", "ADMIN_EMAILS"];
const supabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS"
];

function configured(env, name) {
  return Boolean(env[name]?.trim());
}

function groupStatus(env, keys) {
  const missing = keys.filter((name) => !configured(env, name));
  return {
    ready: missing.length === 0,
    missing,
    keys: keys.map((name) => ({ name, configured: configured(env, name) }))
  };
}

function backendFromEnv(env) {
  if (env.DATA_BACKEND === "postgres") return "postgres";
  if (env.DATA_BACKEND === "supabase") return "supabase";
  return "memory";
}

function buildEnvStatus(env) {
  const backend = backendFromEnv(env);
  return {
    backend,
    postgres: groupStatus(env, postgresKeys),
    supabase: groupStatus(env, supabaseKeys),
    recommendedNextCommand: backend === "postgres"
      ? "npm run postgres:preflight -- --env-file /path/to/alatau-supabase.env"
      : "npm run supabase:preflight -- --env-file /path/to/alatau-supabase.env"
  };
}

applyEnv(loadEnvFile(argValue("--env-file")));

console.log(JSON.stringify(buildEnvStatus(process.env), null, 2));
