import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const allowedSecretWords = new Set([
  "SECRET",
  "SECRET_VALUE",
  "SECRET_PASSWORD",
  "SECRET_ANON",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "EXAMPLE_TOKEN",
  "EXAMPLE_SERVICE_ROLE_KEY",
  "EXAMPLE_PUBLIC_ANON_KEY",
  "REDACTED"
]);

const allowedFilePatterns = [
  /^\.env\.example$/,
  /^ops\/alatau-supabase\.env\.template$/,
  /^tests\//,
  /^docs\//,
  /^README\.md$/
];

const binaryFilePattern = /\.(png|jpe?g|gif|webp|ico|icns|pdf|pptx|zip)$/i;

const forbiddenPathPatterns = [
  /(^|\/)\.env($|[.])/,
  /\.(pem|key|p12|pfx|sqlite|db)$/i,
  /(^|\/)(credentials|secrets?)\//i
];

const tokenPatterns = [
  { id: "private-key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: "openai-key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { id: "github-token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { id: "telegram-token", regex: /\b\d{6,}:[A-Za-z0-9_-]{20,}\b/ },
  { id: "jwt", regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ },
  { id: "supabase-db-url", regex: /postgresql:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s"'`]+/ },
  { id: "long-secret-assignment", regex: /\b[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*["']?[^"'\s#]{16,}/i }
];

function gitLsFiles() {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || "git ls-files failed");
  }
  return [...new Set(result.stdout.split(/\r?\n/).filter(Boolean))];
}

function isAllowedFile(path) {
  return allowedFilePatterns.some((pattern) => pattern.test(path));
}

function hasAllowedSecretWord(line) {
  for (const word of allowedSecretWords) {
    if (line.includes(word)) return true;
  }
  return false;
}

const findings = [];
for (const path of gitLsFiles()) {
  if (binaryFilePattern.test(path)) continue;

  if (forbiddenPathPatterns.some((pattern) => pattern.test(path)) && path !== ".env.example") {
    findings.push({ path, reason: "forbidden secret-like path is present in the workspace" });
    continue;
  }

  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (isAllowedFile(path) && hasAllowedSecretWord(line)) return;
    for (const pattern of tokenPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({ path, line: index + 1, reason: pattern.id });
      }
    }
  });
}

console.log(JSON.stringify({
  ok: findings.length === 0,
  checked: gitLsFiles().length,
  findings
}, null, 2));

process.exit(findings.length === 0 ? 0 : 1);
