import { applyEnv, argValue, loadEnvFile } from "./env-file.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const baseUrl = (argValue("--base-url") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");
const outFile = argValue("--out");

applyEnv(loadEnvFile(argValue("--env-file")));

const backend = process.env.DATA_BACKEND === "postgres" ? "postgres" : process.env.DATA_BACKEND === "supabase" ? "supabase" : "memory";
const postgresMissing = ["SUPABASE_DB_URL", "ADMIN_EMAILS"].filter((name) => !process.env[name]);
const supabaseMissing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS"].filter((name) => !process.env[name]);
const routePaths = [
  "/",
  "/assets/index-mobilefix3-20260628.css",
  "/assets/index-mobilefix3-20260628.js",
  "/crm",
  "/admin/leads",
  "/admin/system",
  "/profile",
  "/api/health",
  "/api/system/status",
  "/release.json"
];

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`).catch(() => undefined);
  if (!response?.ok) return undefined;
  return response.json();
}

async function getText(path) {
  const response = await fetch(`${baseUrl}${path}`).catch(() => undefined);
  if (!response?.ok) return undefined;
  return response.text();
}

async function probeRoute(path) {
  const response = await fetch(`${baseUrl}${path}`, { method: "GET", redirect: "manual" }).catch(() => undefined);
  return { path, status: response?.status || 0 };
}

function evaluate(input) {
  const blockers = [];
  const targetBackend = input.env.backend === "postgres" ? "postgres" : "supabase";
  const envGroup = targetBackend === "postgres" ? input.env.postgres : input.env.supabase;
  if (!envGroup.ready) blockers.push(`${targetBackend} env missing: ${envGroup.missing.join(", ")}`);
  if (!input.runtime.ok) blockers.push("runtime system status is not ok");
  if (!input.runtime.database?.ok) blockers.push(`runtime database health failed for ${input.runtime.database?.backend || input.runtime.backend}`);
  blockers.push(...input.acceptance.blockers);
  return { ok: blockers.length === 0, blockers: [...new Set(blockers)] };
}

const system = await getJson("/api/system/status") || { ok: false };
const runtime = {
  ok: Boolean(system.ok),
  backend: system.status?.backend || "unknown",
  database: system.status?.database || null
};
const routes = [];
for (const path of routePaths) {
  routes.push(await probeRoute(path));
}
const homeHtml = await getText("/");
const acceptanceBlockers = [];
for (const route of routes) {
  if (route.status < 200 || route.status >= 400) acceptanceBlockers.push(`${route.path} returned ${route.status}`);
}
if (runtime.backend === "memory") acceptanceBlockers.push("live database required but active backend is memory");
if (!runtime.database?.ok) acceptanceBlockers.push(`database health failed for ${runtime.database?.backend || runtime.backend}`);
if (homeHtml !== undefined) {
  if (!homeHtml.includes("index-mobilefix3-20260628.css")) acceptanceBlockers.push("home page is missing final storefront css bundle");
  if (!homeHtml.includes("index-mobilefix3-20260628.js")) acceptanceBlockers.push("home page is missing final storefront js bundle");
}

const env = {
  backend,
  postgres: { ready: postgresMissing.length === 0, missing: postgresMissing },
  supabase: { ready: supabaseMissing.length === 0, missing: supabaseMissing }
};
const readiness = evaluate({
  env,
  runtime,
  acceptance: {
    ok: acceptanceBlockers.length === 0,
    blockers: acceptanceBlockers
  }
});

const report = {
  ok: readiness.ok,
  baseUrl,
  env,
  runtime,
  routes,
  blockers: readiness.blockers,
  next: readiness.ok
    ? "Run PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env"
    : "Fix blockers, then run npm run supabase:env-status and the matching preflight.",
  generatedAt: new Date().toISOString()
};

if (outFile) {
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
}

console.log(JSON.stringify(report, null, 2));

process.exit(readiness.ok ? 0 : 1);
