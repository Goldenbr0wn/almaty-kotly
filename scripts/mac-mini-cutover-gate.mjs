import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] || fallback;
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  return prefixed ? prefixed.slice(name.length + 1) : fallback;
}

const stage = argValue("--stage", "pre-dns");

const allowedPreDnsBlockers = new Set([
  "host-readiness: domain DNS A record does not point to the Mac mini public endpoint",
  "host-readiness: current production runtime is memory-backed, not live Supabase/Postgres"
]);

function runStatus() {
  const result = spawnSync("npm", ["run", "mac-mini:status"], { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) {
    return {
      ok: false,
      status: result.status,
      parseError: "mac-mini:status did not return parseable JSON",
      stderr: result.stderr.trim()
    };
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return {
      ok: false,
      status: result.status,
      parseError: error instanceof Error ? error.message : "unknown JSON parse error",
      stderr: result.stderr.trim()
    };
  }
}

function evaluatePreDnsGate(statusReport) {
  const blockers = Array.isArray(statusReport.blockers) ? statusReport.blockers : [];
  const hardBlockers = blockers.filter((blocker) => !allowedPreDnsBlockers.has(blocker));
  const expectedPending = blockers.filter((blocker) => allowedPreDnsBlockers.has(blocker));
  const ok = hardBlockers.length === 0 && !statusReport.parseError;

  return {
    ok,
    stage: "pre-dns",
    decision: ok ? "ready-for-approved-dns-cutover" : "do-not-cutover",
    hardBlockers,
    expectedPending,
    nextActions: ok
      ? [
          "after exact approval, update Porkbun DNS A record to the Mac mini public endpoint",
          "after DNS propagation and exact approval, run ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json"
        ]
      : (Array.isArray(statusReport.nextActions) ? statusReport.nextActions : []),
    sourceSummary: statusReport.summary,
    parseError: statusReport.parseError
  };
}

if (stage !== "pre-dns") {
  console.log(JSON.stringify({
    ok: false,
    stage,
    decision: "unsupported-stage",
    hardBlockers: ["only --stage pre-dns is supported"],
    expectedPending: [],
    nextActions: ["rerun with --stage pre-dns before any DNS mutation"]
  }, null, 2));
  process.exit(2);
}

const statusReport = runStatus();
const gate = evaluatePreDnsGate(statusReport);
console.log(JSON.stringify(gate, null, 2));
process.exit(gate.ok ? 0 : 1);
