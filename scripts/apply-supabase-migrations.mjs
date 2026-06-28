import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { applyEnv, argValue, loadEnvFile } from "./env-file.mjs";

applyEnv(loadEnvFile(argValue("--env-file")));

const dbUrl = process.env.SUPABASE_DB_URL;
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const result = {
  ok: false,
  checks: [
    { name: "SUPABASE_DB_URL", configured: Boolean(dbUrl) },
    { name: "ADMIN_EMAILS", configured: adminEmails.length > 0 }
  ]
};

if (!dbUrl || adminEmails.length === 0) {
  result.blocker = "missing SUPABASE_DB_URL or ADMIN_EMAILS";
  console.log(JSON.stringify(result, null, 2));
  process.exit(2);
}

const sql = postgres(dbUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
  ssl: "require"
});

try {
  const migration = readFileSync(join("supabase", "migrations", "202606280001_backend_v1.sql"), "utf8");
  await sql.unsafe(migration);
  for (const email of adminEmails) {
    await sql`
      insert into public.admin_users(email, active)
      values (${email}, true)
      on conflict (email) do update set active = excluded.active
    `;
  }
  const [leadTable] = await sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'leads'
    ) as exists
  `;
  result.checks.push({ name: "public.leads", exists: Boolean(leadTable?.exists) });
  result.ok = Boolean(leadTable?.exists);
  if (!result.ok) result.blocker = "migration finished but public.leads was not found";
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 3);
} catch (error) {
  result.blocker = error instanceof Error ? error.message : "migration failed";
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 }).catch(() => undefined);
}
