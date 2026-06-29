import { existsSync, statSync } from "node:fs";
import { argValue, loadEnvFile } from "./env-file.mjs";
import { isPlaceholderValue } from "./env-placeholder.mjs";

const path = argValue("--file") || argValue("--env-path") || "/Users/azat/.codex/secrets/alatau-supabase.env";
const requiredKeys = [
  "DATA_BACKEND",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL"
];

function modeString(mode) {
  return mode === undefined ? undefined : `0${(mode & 0o777).toString(8)}`;
}

const exists = existsSync(path);
const mode = exists ? statSync(path).mode : undefined;
const ownerOnly = mode !== undefined && (mode & 0o077) === 0;
const env = exists ? loadEnvFile(path) : {};
const keys = requiredKeys.map((name) => ({
  name,
  configured: Boolean(env[name]?.trim()),
  placeholder: isPlaceholderValue(env[name])
}));

const blockers = [];
const nextActions = [];
if (!exists) {
  blockers.push(`env file not found at ${path}`);
  nextActions.push(`install a filled copy of ops/alatau-supabase.env.template at ${path} with mode 0600`);
}
if (exists && !ownerOnly) {
  blockers.push("env file permissions are too broad; expected owner-only permissions such as 0600");
  nextActions.push(`chmod 600 ${path}`);
}

const missing = keys.filter((key) => !key.configured).map((key) => key.name);
if (missing.length > 0) {
  blockers.push(`missing required keys: ${missing.join(", ")}`);
  nextActions.push(`fill missing keys from the secret manager: ${missing.join(", ")}`);
}

const placeholders = keys.filter((key) => key.placeholder).map((key) => key.name);
if (placeholders.length > 0) {
  blockers.push(`placeholder-looking values remain for keys: ${placeholders.join(", ")}`);
  nextActions.push(`replace placeholder-looking values for keys: ${placeholders.join(", ")}`);
}

console.log(JSON.stringify({
  ok: blockers.length === 0,
  path,
  exists,
  permissions: {
    mode: modeString(mode),
    ownerOnly
  },
  keys,
  blockers,
  nextActions
}, null, 2));

process.exit(blockers.length === 0 ? 0 : 1);
