export type DataBackend = "memory" | "postgres" | "supabase";

export function getDataBackend(): DataBackend {
  if (process.env.DATA_BACKEND === "postgres") return "postgres";
  return process.env.DATA_BACKEND === "supabase" ? "supabase" : "memory";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173";
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function requireServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server env: ${name}`);
  }
  return value;
}

export function getSupabaseEnvStatus(): { ready: boolean; missing: string[] } {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_EMAILS"
  ];
  const missing = required.filter((name) => !process.env[name]);
  return { ready: missing.length === 0, missing };
}

export function getPostgresEnvStatus(): { ready: boolean; missing: string[] } {
  const required = ["SUPABASE_DB_URL", "ADMIN_EMAILS"];
  const missing = required.filter((name) => !process.env[name]);
  return { ready: missing.length === 0, missing };
}
