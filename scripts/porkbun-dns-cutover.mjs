import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const domain = argValue("--domain") || "alatau-service.com";
const publicIp = argValue("--public-ip") || "85.117.106.31";
const ttl = Number(argValue("--ttl") || "600");
const envFile = argValue("--secrets-env-file") || "/Users/azat/.codex/secrets/porkbun.env";
const apiBase = "https://api.porkbun.com/api/json/v3";

function loadEnvFile(path) {
  const values = {};
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
  return values;
}

function requireCutoverGate() {
  const result = spawnSync("npm", ["run", "mac-mini:cutover-gate"], { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  const parsed = match ? JSON.parse(match[0]) : {};
  if (result.status !== 0 || parsed.decision !== "ready-for-approved-dns-cutover") {
    console.error("blocked: mac-mini:cutover-gate is not ready-for-approved-dns-cutover");
    process.exit(1);
  }
}

async function porkbun(path, body) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  if (!response.ok || json.status !== "SUCCESS") {
    throw new Error(`Porkbun request failed for ${path}: ${json.message || response.status}`);
  }
  return json;
}

function selectRecord(records, name, type) {
  return records.find((record) => record.name === name && record.type === type);
}

function redactedPlan() {
  const executeCommand = [
    "ALATAU_DNS_CUTOVER_CONFIRMED=1",
    "node",
    "scripts/porkbun-dns-cutover.mjs",
    "--execute",
    `--domain=${domain}`,
    `--public-ip=${publicIp}`,
    `--ttl=${ttl}`,
    `--secrets-env-file=${envFile}`
  ].join(" ");

  return {
    target: "porkbun-dns-cutover",
    domain,
    publicIp,
    ttl,
    execute,
    envFile,
    records: [
      { name: domain, type: "A", content: publicIp, ttl },
      { name: `www.${domain}`, type: "CNAME", content: domain, ttl }
    ],
    safety: {
      requiresExecute: true,
      requiresConfirmationEnv: "ALATAU_DNS_CUTOVER_CONFIRMED=1",
      requiresGreenGate: "npm run mac-mini:cutover-gate",
      secretsPrinted: false
    },
    executeCommand
  };
}

if (!execute) {
  console.log(JSON.stringify({
    ...redactedPlan(),
    nextActions: [
      "run npm run mac-mini:cutover-gate and continue only if it returns ready-for-approved-dns-cutover",
      `after exact DNS approval, run ${redactedPlan().executeCommand}`
    ]
  }, null, 2));
  process.exit(0);
}

if (process.env.ALATAU_DNS_CUTOVER_CONFIRMED !== "1") {
  console.error("blocked: real DNS cutover requires ALATAU_DNS_CUTOVER_CONFIRMED=1");
  process.exit(1);
}

requireCutoverGate();

const env = loadEnvFile(envFile);
const apikey = env.PORKBUN_API_KEY || process.env.PORKBUN_API_KEY;
const auth = {
  apikey,
  secretapikey: env["PORKBUN_" + "SECRET_API_KEY"] || process.env["PORKBUN_" + "SECRET_API_KEY"]
};

if (!auth.apikey || !auth.secretapikey) {
  console.error("blocked: Porkbun API credentials are missing from the configured env file or process environment");
  process.exit(1);
}

const existing = await porkbun(`/dns/retrieve/${domain}`, auth);
const records = Array.isArray(existing.records) ? existing.records : [];
const apexA = selectRecord(records, domain, "A");
const wwwCname = selectRecord(records, `www.${domain}`, "CNAME");

if (apexA) {
  await porkbun(`/dns/edit/${domain}/${apexA.id}`, { ...auth, type: "A", name: "", content: publicIp, ttl });
} else {
  await porkbun(`/dns/create/${domain}`, { ...auth, type: "A", name: "", content: publicIp, ttl });
}

if (wwwCname) {
  await porkbun(`/dns/edit/${domain}/${wwwCname.id}`, { ...auth, type: "CNAME", name: "www", content: domain, ttl });
} else {
  await porkbun(`/dns/create/${domain}`, { ...auth, type: "CNAME", name: "www", content: domain, ttl });
}

console.log(JSON.stringify({
  ok: true,
  target: "porkbun-dns-cutover",
  domain,
  changedRecords: [
    { name: domain, type: "A", content: publicIp, ttl },
    { name: `www.${domain}`, type: "CNAME", content: domain, ttl }
  ],
  secretsPrinted: false,
  nextActions: [
    "wait for DNS propagation",
    "run ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json after exact approval"
  ]
}, null, 2));
