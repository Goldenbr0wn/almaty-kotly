import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const preparedEnv = argValue("--prepared-env") || "/tmp/alatau-supabase.env.todo";
const targetEnv = argValue("--target-env") || "/Users/azat/.codex/secrets/alatau-supabase.env";
const outPath = argValue("--out") || "/tmp/alatau-guarded-dry-run-receipt.json";

const checks = [
  {
    id: "supabase-env-install-dry-run",
    args: ["run", "supabase:env-install:dry-run", "--", "--source", preparedEnv, "--target", targetEnv],
    classify(result) {
      const text = `${result.stdout}\n${result.stderr}`;
      if (result.status === 0) {
        return {
          ok: true,
          expectedBlock: false,
          evidence: "filled env candidate passed guarded install dry-run; no install executed"
        };
      }
      return {
        ok: text.includes("placeholder-looking values") || text.includes("missing required keys") || text.includes("source env file is missing"),
        expectedBlock: true,
        evidence: text.includes("placeholder-looking values")
          ? `blocked placeholder-looking values in ${preparedEnv} before install`
          : "blocked before install because the env candidate is not ready"
      };
    }
  },
  {
    id: "mac-mini-install-dry-run",
    args: ["run", "mac-mini:install:dry-run"],
    classify(result) {
      const text = `${result.stdout}\n${result.stderr}`;
      return {
        ok: result.status === 0 && text.includes("done: mac-mini install dry-run mode"),
        expectedBlock: false,
        evidence: "env/readiness/template blockers surfaced when present; standalone smoke and rendered launchd validation are exercised; install commands are printed as dry-run only"
      };
    }
  },
  {
    id: "mac-mini-caddy-dry-run",
    args: ["run", "mac-mini:caddy:dry-run"],
    classify(result) {
      const text = `${result.stdout}\n${result.stderr}`;
      if (result.status === 0) {
        return {
          ok: true,
          expectedBlock: false,
          evidence: "Caddy dry-run completed without host mutation"
        };
      }
      return {
        ok: text.includes("Homebrew is not installed") || text.includes("Caddy is not installed"),
        expectedBlock: true,
        evidence: "blocked because Homebrew/Caddy is not installed or not in PATH; install commands were printed as dry-run only"
      };
    }
  },
  {
    id: "mac-mini-security-hardening-dry-run",
    args: ["run", "mac-mini:security-hardening:dry-run"],
    classify(result) {
      const text = `${result.stdout}\n${result.stderr}`;
      return {
        ok: result.status === 0 && text.includes("dry-run:"),
        expectedBlock: false,
        evidence: "printed firewall and stealth-mode commands without executing host mutation"
      };
    }
  }
];

function runCheck(check) {
  const result = spawnSync("npm", check.args, { encoding: "utf8" });
  const classified = check.classify(result);
  return {
    id: check.id,
    command: ["npm", ...check.args].join(" "),
    status: result.status,
    ...classified
  };
}

const results = checks.map(runCheck);
const report = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-guarded-dry-runs",
  ok: results.every((result) => result.ok),
  preparedEnv,
  installTarget: targetEnv,
  checks: results,
  nextAction: `fill ${preparedEnv} with real Supabase/admin values, then rerun npm run supabase:env-postfill-gate -- --file ${preparedEnv} --out /tmp/alatau-supabase-env-postfill.json`,
  safety: {
    secretsPrinted: false,
    installsEnv: false,
    hostDnsRouterMutations: false,
    hostMutations: false,
    dryRunOnly: true
  }
};

const serialized = JSON.stringify(report, null, 2);
writeOwnerOnlyFile(outPath, `${serialized}\n`);
console.log(serialized);
process.exit(report.ok ? 0 : 1);
