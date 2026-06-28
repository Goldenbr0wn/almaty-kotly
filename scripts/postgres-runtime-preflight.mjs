import postgres from "postgres";
import { applyEnv, argValue, loadEnvFile } from "./env-file.mjs";

applyEnv(loadEnvFile(argValue("--env-file")));

const required = ["SUPABASE_DB_URL", "ADMIN_EMAILS"];
const missing = required.filter((name) => !process.env[name]);
const result = {
  ok: false,
  mode: "postgres",
  env: required.map((name) => ({ name, configured: Boolean(process.env[name]) })),
  checks: [],
  blockers: []
};

if (missing.length) {
  result.blocker = `missing required env: ${missing.join(", ")}`;
  console.log(JSON.stringify(result, null, 2));
  process.exit(2);
}

const sql = postgres(process.env.SUPABASE_DB_URL, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
  ssl: "require"
});

try {
  const [tables] = await sql`
    select
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leads') as leads,
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lead_events') as lead_events,
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'admin_users') as admin_users
  `;
  const tableChecks = {
    leads: Boolean(tables?.leads),
    lead_events: Boolean(tables?.lead_events),
    admin_users: Boolean(tables?.admin_users)
  };
  const [adminRow] = tableChecks.admin_users
    ? await sql`select count(*)::int as count from public.admin_users where active = true`
    : [{ count: 0 }];
  const activeAdminCount = Number(adminRow?.count || 0);
  result.checks.push({ name: "runtime_tables", ...tableChecks });
  result.checks.push({ name: "active_admin_users", count: activeAdminCount });
  for (const [name, exists] of Object.entries(tableChecks)) {
    if (!exists) result.blockers.push(`public.${name} not found`);
  }
  if (activeAdminCount < 1) result.blockers.push("active admin_users count is 0");
  result.ok = result.blockers.length === 0;
  if (!result.ok) result.blocker = result.blockers.join("; ");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 3);
} catch (error) {
  result.blocker = error instanceof Error ? error.message : "postgres preflight failed";
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 }).catch(() => undefined);
}
