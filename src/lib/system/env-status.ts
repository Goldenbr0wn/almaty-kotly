import type { DataBackend } from "@/lib/env";
import { isPlaceholderValue } from "@/lib/system/env-placeholder";

type EnvMap = Record<string, string | undefined>;

type EnvGroupStatus = {
  ready: boolean;
  missing: string[];
  placeholders: string[];
  keys: Array<{ name: string; configured: boolean; placeholder: boolean }>;
};

export type EnvStatus = {
  backend: DataBackend;
  postgres: EnvGroupStatus;
  supabase: EnvGroupStatus;
  recommendedNextCommand: string;
};

const postgresKeys = ["SUPABASE_DB_URL", "ADMIN_EMAILS"];
const supabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS"
];

function configured(env: EnvMap, name: string): boolean {
  return Boolean(env[name]?.trim());
}

function groupStatus(env: EnvMap, keys: string[]): EnvGroupStatus {
  const missing = keys.filter((name) => !configured(env, name));
  const placeholders = keys.filter((name) => isPlaceholderValue(env[name]));
  return {
    ready: missing.length === 0 && placeholders.length === 0,
    missing,
    placeholders,
    keys: keys.map((name) => ({ name, configured: configured(env, name), placeholder: isPlaceholderValue(env[name]) }))
  };
}

function backendFromEnv(env: EnvMap): DataBackend {
  if (env.DATA_BACKEND === "postgres") return "postgres";
  if (env.DATA_BACKEND === "supabase") return "supabase";
  return "memory";
}

export function buildEnvStatus(env: EnvMap): EnvStatus {
  const backend = backendFromEnv(env);
  const postgres = groupStatus(env, postgresKeys);
  const supabase = groupStatus(env, supabaseKeys);
  const recommendedNextCommand = backend === "postgres"
    ? "npm run postgres:preflight -- --runtime-env-file /path/to/alatau-supabase.env"
    : "npm run supabase:preflight -- --runtime-env-file /path/to/alatau-supabase.env";

  return {
    backend,
    postgres,
    supabase,
    recommendedNextCommand
  };
}
