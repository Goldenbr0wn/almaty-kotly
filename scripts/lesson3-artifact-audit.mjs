import { existsSync, readFileSync, statSync } from "node:fs";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out") || "/tmp/alatau-lesson3-artifact-audit.json";
const bundlePath = argValue("--bundle") || "/tmp/alatau-lesson3-bundle-default.json";

const assignmentPattern = /\b[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE)[A-Z0-9_]*\s*=\s*["']?[^"'\s#]{8,}/i;
const privateKeyPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const tokenPatterns = [
  { id: "github-token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { id: "openai-key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { id: "telegram-token", regex: /\b\d{6,}:[A-Za-z0-9_-]{20,}\b/ },
  { id: "jwt", regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ },
  { id: "private-key", regex: privateKeyPattern },
  { id: "secret-assignment", regex: assignmentPattern }
];

function modeString(mode) {
  return `0${(mode & 0o777).toString(8)}`;
}

function scanText(path, text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of tokenPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({ path, line: index + 1, reason: pattern.id });
      }
    }
  });
  return findings;
}

function loadBundleArtifacts(path) {
  if (!existsSync(path)) {
    return { artifacts: [path], findings: [{ path, reason: "missing-bundle" }] };
  }

  try {
    const bundle = JSON.parse(readFileSync(path, "utf8"));
    const artifactPaths = Object.values(bundle.artifacts ?? {}).filter((artifact) => typeof artifact === "string");
    return {
      artifacts: Array.from(new Set([path, ...artifactPaths])),
      findings: []
    };
  } catch (error) {
    return {
      artifacts: [path],
      findings: [{ path, reason: "invalid-bundle-json", message: error.message }]
    };
  }
}

const checks = [];
const { artifacts, findings } = loadBundleArtifacts(bundlePath);
for (const path of artifacts) {
  const exists = existsSync(path);
  const stat = exists ? statSync(path) : undefined;
  const mode = stat ? modeString(stat.mode) : undefined;
  const ownerOnly = stat ? (stat.mode & 0o077) === 0 : false;
  const text = exists ? readFileSync(path, "utf8") : "";
  const secretFindings = exists ? scanText(path, text) : [];
  findings.push(...secretFindings);
  checks.push({
    path,
    exists,
    mode,
    ownerOnly,
    secretFindingCount: secretFindings.length
  });
  if (!exists) findings.push({ path, reason: "missing-artifact" });
  if (exists && !ownerOnly) findings.push({ path, reason: "permissions-not-owner-only", mode });
}

const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-artifact-audit",
  bundle: bundlePath,
  artifactSource: "bundle",
  ok: findings.length === 0,
  checks,
  findings,
  safety: {
    readOnly: true,
    secretsPrinted: false,
    hostDnsRouterMutations: false
  }
};

const serialized = JSON.stringify(report, null, 2);
writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
