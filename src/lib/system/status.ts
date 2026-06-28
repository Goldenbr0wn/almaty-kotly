import { getDataBackend, getPostgresEnvStatus, getSupabaseEnvStatus } from "@/lib/env";
import { getLeadRepository } from "@/lib/leads/repository";

type DatabaseHealth = {
  ok: boolean;
  backend: string;
};

export type SystemStatus = {
  backend: "memory" | "postgres" | "supabase";
  ok: boolean;
  adminAuth: {
    ready: boolean;
    mode: "local-dev" | "supabase";
    adminCount: number;
    missing: string[];
  };
  activeStore: {
    ready: boolean;
    missing: string[];
  };
  supabase: {
    ready: boolean;
    missing: string[];
  };
  postgres: {
    ready: boolean;
    missing: string[];
  };
  commands: {
    migrate: string;
    preflight: string;
    cutover: string;
  };
};

export type RuntimeSystemStatus = SystemStatus & {
  database: DatabaseHealth;
};

function getAdminAuthStatus(backend: "memory" | "postgres" | "supabase"): SystemStatus["adminAuth"] {
  const adminCount = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .length;
  const mode = backend === "memory" ? "local-dev" : "supabase";
  const required = mode === "local-dev"
    ? ["ADMIN_EMAILS", "LOCAL_ADMIN_EMAIL"]
    : ["ADMIN_EMAILS", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((name) => !process.env[name]);

  return {
    ready: missing.length === 0,
    mode,
    adminCount,
    missing
  };
}

export function getSystemStatus(): SystemStatus {
  const backend = getDataBackend();
  const supabase = getSupabaseEnvStatus();
  const postgres = getPostgresEnvStatus();
  const activeStore = backend === "supabase" ? supabase : backend === "postgres" ? postgres : { ready: true, missing: [] };

  return {
    backend,
    ok: activeStore.ready,
    adminAuth: getAdminAuthStatus(backend),
    activeStore,
    supabase,
    postgres,
    commands: {
      migrate: "npm run supabase:migrate -- --env-file /path/to/alatau-supabase.env",
      preflight: "npm run supabase:preflight -- --env-file /path/to/alatau-supabase.env",
      cutover: "PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env"
    }
  };
}

export async function getRuntimeSystemStatus(
  checkDatabase: () => Promise<DatabaseHealth> = () => getLeadRepository().health()
): Promise<RuntimeSystemStatus> {
  const status = getSystemStatus();
  const database = status.activeStore.ready
    ? await checkDatabase().catch(() => ({ ok: false, backend: status.backend }))
    : { ok: false, backend: status.backend };

  return {
    ...status,
    ok: status.activeStore.ready && database.ok,
    database
  };
}
