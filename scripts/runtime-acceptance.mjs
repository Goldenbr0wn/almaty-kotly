const args = new Set(process.argv.slice(2));
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = (baseUrlArg ? baseUrlArg.slice("--base-url=".length) : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");
const requireLiveDb = args.has("--require-live-db");
const postLead = args.has("--post-lead");

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

function evaluateRuntimeAcceptance(input) {
  const blockers = [];
  for (const route of input.routes) {
    if (route.status < 200 || route.status >= 400) {
      blockers.push(`${route.path} returned ${route.status}`);
    }
  }
  const backend = input.system?.status?.backend || "unknown";
  const database = input.system?.status?.database;
  if (!input.system?.ok) blockers.push("system status is not ok");
  if (!database?.ok) blockers.push(`database health failed for ${database?.backend || backend}`);
  if (input.requireLiveDb && backend === "memory") blockers.push("live database required but active backend is memory");
  if (input.homeHtml !== undefined) {
    if (!input.homeHtml.includes("index-mobilefix3-20260628.css")) {
      blockers.push("home page is missing final storefront css bundle");
    }
    if (!input.homeHtml.includes("index-mobilefix3-20260628.js")) {
      blockers.push("home page is missing final storefront js bundle");
    }
  }
  return { ok: blockers.length === 0, blockers };
}

async function probeRoute(path) {
  const response = await fetch(`${baseUrl}${path}`, { method: "GET", redirect: "manual" });
  return { path, status: response.status };
}

async function maybePostLead() {
  if (!postLead) return undefined;
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Acceptance Smoke",
      phone: "+77010000000",
      service: "Диагностика",
      model: "smoke",
      district: "Алматы",
      comment: "runtime acceptance",
      consent: true,
      company: ""
    })
  });
  return { path: "/api/leads", status: response.status };
}

const routes = [];
for (const path of routePaths) {
  routes.push(await probeRoute(path).catch(() => ({ path, status: 0 })));
}

const systemResponse = await fetch(`${baseUrl}/api/system/status`).catch(() => undefined);
const system = systemResponse?.ok ? await systemResponse.json() : { ok: false };
const homeResponse = await fetch(`${baseUrl}/`).catch(() => undefined);
const homeHtml = homeResponse?.ok ? await homeResponse.text() : undefined;
const leadPost = await maybePostLead().catch(() => ({ path: "/api/leads", status: 0 }));
if (leadPost) routes.push(leadPost);

const acceptance = evaluateRuntimeAcceptance({ routes, system, requireLiveDb, homeHtml });
if (leadPost && (leadPost.status < 200 || leadPost.status >= 300)) {
  acceptance.ok = false;
  acceptance.blockers.push(`/api/leads returned ${leadPost.status}`);
}

console.log(JSON.stringify({
  ok: acceptance.ok,
  baseUrl,
  requireLiveDb,
  routes,
  system: {
    ok: Boolean(system.ok),
    backend: system.status?.backend || "unknown",
    database: system.status?.database || null
  },
  blockers: acceptance.blockers
}, null, 2));

process.exit(acceptance.ok ? 0 : 1);
