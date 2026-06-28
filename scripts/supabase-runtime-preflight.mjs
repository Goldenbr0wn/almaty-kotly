import { applyEnv, argValue, loadEnvFile } from "./env-file.mjs";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS"
];

function redactStatus(name) {
  return { name, configured: Boolean(process.env[name]) };
}

applyEnv(loadEnvFile(argValue("--env-file")));

const missing = required.filter((name) => !process.env[name]);
const result = {
  ok: false,
  mode: "supabase",
  env: required.map(redactStatus),
  checks: [],
  blockers: []
};

if (missing.length) {
  result.blocker = `missing required env: ${missing.join(", ")}`;
  console.log(JSON.stringify(result, null, 2));
  process.exit(2);
}

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
async function restCheck(path) {
  return fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
}

const response = await restCheck("leads?select=id&limit=1");

result.checks.push({ name: "rest_leads_select", status: response.status });
if (!response.ok) {
  result.blockers.push("public.leads REST check failed");
}

const eventsResponse = await restCheck("lead_events?select=id&limit=1");
result.checks.push({ name: "rest_lead_events_select", status: eventsResponse.status });
if (!eventsResponse.ok) {
  result.blockers.push("public.lead_events REST check failed");
}

const adminsResponse = await restCheck("admin_users?select=email&active=eq.true&limit=1");
const activeAdminCount = adminsResponse.ok ? (await adminsResponse.json()).length : 0;
result.checks.push({ name: "rest_active_admin_users_select", status: adminsResponse.status, count: activeAdminCount });
if (!adminsResponse.ok) {
  result.blockers.push("public.admin_users REST check failed");
}
if (activeAdminCount < 1) {
  result.blockers.push("active admin_users count is 0");
}

if (result.blockers.length) {
  result.blocker = result.blockers.join("; ");
  console.log(JSON.stringify(result, null, 2));
  process.exit(3);
}

result.ok = true;
console.log(JSON.stringify(result, null, 2));
