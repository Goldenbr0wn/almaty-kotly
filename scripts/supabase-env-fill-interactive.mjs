import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { argValue, loadEnvFile } from "./env-file.mjs";
import { isPlaceholderValue } from "./env-placeholder.mjs";

const envFile = argValue("--file") || "/tmp/alatau-supabase.env.todo";
const force = process.argv.includes("--force");

const requiredKeys = [
  "DATA_BACKEND",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL"
];

const sensitiveKeys = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL"
]);

const defaults = {
  DATA_BACKEND: "postgres",
  NEXT_PUBLIC_SITE_URL: "https://alatau-service.com"
};

function ensureTty() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("blocked: interactive fill requires a TTY so secret prompts are not captured in command output");
    process.exit(2);
  }
}

function quoteEnvValue(value) {
  if (/^[A-Za-z0-9_./:@,+-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function parseTemplateLines(path) {
  const text = readFileSync(path, "utf8");
  return text.split(/\r?\n/);
}

function renderEnv(lines, values) {
  const seen = new Set();
  const rendered = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match) return line;
    const key = match[1];
    if (!Object.prototype.hasOwnProperty.call(values, key)) return line;
    seen.add(key);
    return `${key}=${quoteEnvValue(values[key])}`;
  });

  for (const key of requiredKeys) {
    if (!seen.has(key)) rendered.push(`${key}=${quoteEnvValue(values[key])}`);
  }

  return `${rendered.join("\n").replace(/\s*$/, "")}\n`;
}

function setTerminalEcho(enabled) {
  const result = spawnSync("stty", [enabled ? "echo" : "-echo"], {
    stdio: ["inherit", "ignore", "ignore"]
  });
  return result.status === 0;
}

async function askSecret(rl, prompt) {
  const echoDisabled = setTerminalEcho(false);
  try {
    const answer = await rl.question(prompt);
    return answer;
  } finally {
    if (echoDisabled) setTerminalEcho(true);
    rl.output.write("\n");
  }
}

function statusForValue(value) {
  if (!value?.trim()) return "missing";
  if (isPlaceholderValue(value)) return "placeholder";
  return "configured";
}

ensureTty();

if (!existsSync(envFile)) {
  console.error(`blocked: env file missing at ${envFile}; run npm run supabase:env-prepare -- --out ${envFile}`);
  process.exit(1);
}

const existing = loadEnvFile(envFile);
const initialStatuses = requiredKeys.map((key) => ({
  key,
  status: statusForValue(existing[key])
}));
const needsValues = initialStatuses.filter((item) => item.status !== "configured").map((item) => item.key);

if (needsValues.length === 0 && !force) {
  console.error(`blocked: ${envFile} already has configured values; pass --force to review and overwrite`);
  process.exit(1);
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

try {
  console.log(JSON.stringify({
    target: "supabase-env-fill-interactive",
    envFile,
    keys: initialStatuses,
    safety: {
      writesEnvFile: true,
      installsEnv: false,
      secretsPrinted: false,
      hostDnsRouterMutations: false
    }
  }, null, 2));

  const nextValues = { ...existing };
  for (const key of requiredKeys) {
    const current = existing[key];
    const currentStatus = statusForValue(current);
    const fallback = defaults[key] || "";
    const keepConfigured = currentStatus === "configured" && !force;
    if (keepConfigured) continue;

    const promptDefault = fallback ? ` [default: ${fallback}]` : "";
    const prompt = `${key}${sensitiveKeys.has(key) ? " (hidden)" : ""}${promptDefault}: `;
    const answer = sensitiveKeys.has(key) ? await askSecret(rl, prompt) : await rl.question(prompt);
    const value = answer.trim() || fallback;
    nextValues[key] = value;
  }

  const remaining = requiredKeys.filter((key) => statusForValue(nextValues[key]) !== "configured");
  if (remaining.length > 0) {
    console.error(`blocked: required values still missing or placeholder-looking for keys: ${remaining.join(", ")}`);
    process.exitCode = 1;
  } else {
    writeFileSync(envFile, renderEnv(parseTemplateLines(envFile), nextValues), { mode: 0o600 });
    chmodSync(envFile, 0o600);
    console.log(JSON.stringify({
      ok: true,
      envFile,
      configuredKeys: requiredKeys,
      nextActions: [
        `npm run supabase:env-audit -- --file ${envFile}`,
        `npm run supabase:env-postfill-gate -- --file ${envFile} --out /tmp/alatau-supabase-env-postfill.json`
      ],
      safety: {
        secretsPrinted: false,
        installsEnv: false,
        hostDnsRouterMutations: false
      }
    }, null, 2));
  }
} finally {
  rl.close();
}
