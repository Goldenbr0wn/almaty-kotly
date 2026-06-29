import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("ops scripts", () => {
  it("forces owner-only permissions when overwriting existing report artifacts", () => {
    const dir = mkdtempSync(join(tmpdir(), "alatau-owner-file-"));
    const target = join(dir, "report.json");

    try {
      writeFileSync(target, "{}\n", { mode: 0o644 });
      chmodSync(target, 0o644);

      execFileSync(
        "node",
        [
          "--input-type=module",
          "-e",
          "import { writeOwnerOnlyFile } from './scripts/write-owner-file.mjs'; writeOwnerOnlyFile(process.argv[1], '{\"ok\":true}\\n');",
          target
        ],
        { cwd: process.cwd() }
      );

      expect(`0${(statSync(target).mode & 0o777).toString(8)}`).toBe("0600");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("runs security scan and writes release receipts during deploy", () => {
    const deploy = readFileSync("ops/deploy.sh", "utf8");

    expect(deploy).toContain("npm run security:scan");
    expect(deploy).toContain("npm run supabase:env-audit -- --file \"$runtime_env_file\"");
    expect(deploy).toContain("ALATAU_DEPLOY_CONFIRMED");
    expect(deploy).toContain("ALATAU_SUPABASE_ENV_FILE");
    expect(deploy).toContain("blocked: real deploy requires ALATAU_DEPLOY_CONFIRMED=1");
    expect(deploy).toContain("$release_dir/release.json");
    expect(deploy).toContain("$service_root/current-release.json");
    expect(deploy).toContain("APP_RELEASE_SHA");
  });

  it("keeps Supabase env installation guarded and redacted", () => {
    const envInstall = readFileSync("ops/supabase-env-install.sh", "utf8");

    expect(envInstall).toContain("--execute");
    expect(envInstall).toContain("ALATAU_ENV_INSTALL_CONFIRMED");
    expect(envInstall).toContain("blocked: real env installation requires ALATAU_ENV_INSTALL_CONFIRMED=1");
    expect(envInstall).toContain("blocked: source and target env file paths are required");
    expect(envInstall).toContain("blocked: source env file is missing");
    expect(envInstall).toContain("blocked: source and target env files must be different");
    expect(envInstall).toContain("--source=*)");
    expect(envInstall).toContain("--target=*)");
    expect(envInstall).toContain("npm run supabase:env-audit -- --file \"");
    expect(envInstall).toContain("npm run supabase:env-audit -- --file \"$source_file\"");
    expect(envInstall).toContain("install -m 600 \"$source_file\" \"$target_file\"");
    expect(envInstall).toContain("npm run supabase:env-audit -- --file \"$target_file\"");
    expect(envInstall).toContain("[redacted-source]");
  });

  it("keeps shell operator scripts strict about unknown arguments", () => {
    for (const script of [
      "ops/caddy-install.sh",
      "ops/caddy-service.sh",
      "ops/deploy.sh",
      "ops/healthcheck.sh",
      "ops/rollback.sh",
      "ops/supabase-env-install.sh"
    ]) {
      const result = spawnSync("bash", [script, "--definitely-unknown"], {
        cwd: process.cwd(),
        encoding: "utf8"
      });

      expect(result.status, script).toBe(2);
      expect(result.stderr, script).toContain("unknown argument: --definitely-unknown");
    }
  });

  it("accepts equals-style source and target args for Supabase env install dry-run", () => {
    const result = spawnSync(
      "bash",
      [
        "ops/supabase-env-install.sh",
        "--dry-run",
        "--source=/tmp/alatau-env-install-missing.env",
        "--target=/tmp/alatau-env-install-target.env"
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("blocked: source env file is missing");
    expect(result.stdout).toContain("source file: /tmp/alatau-env-install-missing.env");
    expect(result.stdout).toContain("target file: /tmp/alatau-env-install-target.env");
  });

  it("prepares a placeholder Supabase env file without installing secrets", () => {
    const envPrepare = readFileSync("scripts/supabase-env-prepare.mjs", "utf8");

    expect(envPrepare).toContain("supabase-env-prepare");
    expect(envPrepare).toContain("ops/alatau-supabase.env.template");
    expect(envPrepare).toContain("/tmp/alatau-supabase.env.todo");
    expect(envPrepare).toContain("--force");
    expect(envPrepare).toContain("0o600");
    expect(envPrepare).toContain("chmodSync(outPath, 0o600)");
    expect(envPrepare).toContain("writesPlaceholderOnly: true");
    expect(envPrepare).toContain("secretsPrinted: false");
    expect(envPrepare).toContain("installsEnv: false");
    expect(envPrepare).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("renders a redacted Supabase env fill guide from audit status", () => {
    const fillGuide = readFileSync("scripts/supabase-env-fill-guide.mjs", "utf8");

    expect(fillGuide).toContain("Supabase Env Fill Guide");
    expect(fillGuide).toContain("argValue");
    expect(fillGuide).toContain("supabase:env-fill-interactive");
    expect(fillGuide).toContain("supabase:env-audit");
    expect(fillGuide).toContain("supabase:env-postfill-gate");
    expect(fillGuide).toContain("/tmp/alatau-supabase.env.todo");
    expect(fillGuide).toContain("Project Settings -> API -> Project URL");
    expect(fillGuide).toContain("Project Settings -> Database");
    expect(fillGuide).toContain("Values printed: no");
    expect(fillGuide).toContain("Secrets installed: no");
    expect(fillGuide).toContain("writeOwnerOnlyFile");
    expect(fillGuide).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(fillGuide).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");
  });

  it("keeps interactive Supabase env fill local, owner-only, and redacted", () => {
    const fillInteractive = readFileSync("scripts/supabase-env-fill-interactive.mjs", "utf8");
    const pkg = readFileSync("package.json", "utf8");

    expect(pkg).toContain("supabase:env-fill-interactive");
    expect(fillInteractive).toContain("supabase-env-fill-interactive");
    expect(fillInteractive).toContain("readline/promises");
    expect(fillInteractive).toContain("interactive fill requires a TTY");
    expect(fillInteractive).toContain("stty");
    expect(fillInteractive).toContain("-echo");
    expect(fillInteractive).toContain("setTerminalEcho(true)");
    expect(fillInteractive).toContain("sensitiveKeys");
    expect(fillInteractive).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(fillInteractive).toContain("chmodSync(envFile, 0o600)");
    expect(fillInteractive).toContain("secretsPrinted: false");
    expect(fillInteractive).toContain("installsEnv: false");
    expect(fillInteractive).toContain("hostDnsRouterMutations: false");
    expect(fillInteractive).toContain("supabase:env-postfill-gate");
    expect(fillInteractive).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(fillInteractive).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");
  });

  it("keeps the Supabase env post-fill gate read-only and redacted", () => {
    const postfill = readFileSync("scripts/supabase-env-postfill-gate.mjs", "utf8");
    const writer = readFileSync("scripts/write-owner-file.mjs", "utf8");
    const supabasePreflight = readFileSync("scripts/supabase-runtime-preflight.mjs", "utf8");
    const placeholder = readFileSync("scripts/env-placeholder.mjs", "utf8");
    const readiness = readFileSync("scripts/supabase-readiness.mjs", "utf8");
    const cutover = readFileSync("scripts/cutover-local-supabase.mjs", "utf8");

    expect(postfill).toContain("supabase-env-postfill-gate");
    expect(postfill).toContain("argValue");
    expect(postfill).toContain("supabase:env-audit");
    expect(postfill).toContain("supabase:env-fill-interactive");
    expect(postfill).toContain("supabase:env-install:dry-run");
    expect(postfill).toContain("ALATAU_ENV_INSTALL_CONFIRMED=1");
    expect(postfill).toContain("supabase:readiness");
    expect(postfill).toContain("supabase:preflight");
    expect(postfill).toContain("readOnly: true");
    expect(postfill).toContain("secretsPrinted: false");
    expect(postfill).toContain("installsEnv: false");
    expect(postfill).toContain("writeOwnerOnlyFile");
    expect(writer).toContain("chmodSync(path, 0o600)");
    expect(readiness).toContain("writeOwnerOnlyFile");
    expect(cutover).toContain("writeOwnerOnlyFile");
    expect(postfill).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(postfill).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");

    const envAudit = readFileSync("scripts/supabase-env-audit.mjs", "utf8");
    const envStatus = readFileSync("scripts/supabase-env-status.mjs", "utf8");
    expect(envAudit).toContain("env-placeholder.mjs");
    expect(envStatus).toContain("env-placeholder.mjs");
    expect(placeholder).toContain("TEST-TOKEN-NOT-REAL");
    expect(placeholder).toContain("SYNTHETIC");
    expect(supabasePreflight).toContain("Supabase REST preflight failed");
  });

  it("keeps rollback on Mac mini paths and writes current release receipt", () => {
    const rollback = readFileSync("ops/rollback.sh", "utf8");

    expect(rollback).toContain("/Users/azat/Services/alatau-service/releases");
    expect(rollback).toContain("ALATAU_ROLLBACK_CONFIRMED");
    expect(rollback).toContain("blocked: real rollback requires ALATAU_ROLLBACK_CONFIRMED=1");
    expect(rollback).toContain("$service_root/current-release.json");
    expect(rollback).toContain("rolledBackAt");
  });

  it("keeps Caddy installation guarded behind explicit execute", () => {
    const caddyInstall = readFileSync("ops/caddy-install.sh", "utf8");

    expect(caddyInstall).toContain("--execute");
    expect(caddyInstall).toContain("brew install caddy");
    expect(caddyInstall).toContain("caddy validate --config");
    expect(caddyInstall).toContain("blocked: Homebrew is not installed or not in PATH");
    expect(caddyInstall).toContain("next: install Homebrew or choose another approved package manager before executing Caddy installation");
  });

  it("keeps Caddy service mutation guarded behind explicit execute and confirmation", () => {
    const caddyService = readFileSync("ops/caddy-service.sh", "utf8");

    expect(caddyService).toContain("--execute");
    expect(caddyService).toContain("ALATAU_CADDY_SERVICE_CONFIRMED");
    expect(caddyService).toContain("blocked: real Caddy service mutation requires ALATAU_CADDY_SERVICE_CONFIRMED=1");
    expect(caddyService).toContain("cp \"$source_caddyfile\" \"$target_caddyfile\"");
    expect(caddyService).toContain("caddy validate --config \"$target_caddyfile\"");
    expect(caddyService).toContain("brew services restart caddy");
    expect(caddyService).toContain("target caddyfile: unavailable until Homebrew is installed or an approved Caddy config path is chosen");
    expect(caddyService).toContain("next: install Homebrew or choose another approved service manager before installing the Caddyfile");
  });

  it("keeps DNS cutover guarded by a pre-DNS gate", () => {
    const cutoverGate = readFileSync("scripts/mac-mini-cutover-gate.mjs", "utf8");
    const porkbunCutover = readFileSync("scripts/porkbun-dns-cutover.mjs", "utf8");

    expect(cutoverGate).toContain("allowedPreDnsBlockers");
    expect(cutoverGate).toContain("function argValue");
    expect(cutoverGate).toContain("domain DNS A record does not point to the Mac mini public endpoint");
    expect(cutoverGate).toContain("current production runtime is memory-backed, not live Supabase/Postgres");
    expect(cutoverGate).toContain("decision: ok ? \"ready-for-approved-dns-cutover\" : \"do-not-cutover\"");
    expect(cutoverGate).toContain("mac-mini:post-cutover");
    expect(cutoverGate).toContain("unsupported-stage");
    expect(cutoverGate).not.toContain("after DNS propagation, run npm run runtime:acceptance");
    expect(porkbunCutover).toContain("ALATAU_DNS_CUTOVER_CONFIRMED");
    expect(porkbunCutover).toContain("requiresGreenGate");
    expect(porkbunCutover).toContain("executeCommand");
    expect(porkbunCutover).toContain("--secrets-env-file=${envFile}");
    expect(porkbunCutover).toContain("--domain=${domain}");
    expect(porkbunCutover).toContain("--public-ip=${publicIp}");
    expect(porkbunCutover).toContain("--ttl=${ttl}");
    expect(porkbunCutover).toContain("mac-mini:cutover-gate");
    expect(porkbunCutover).toContain("/dns/retrieve/");
    expect(porkbunCutover).toContain("/dns/edit/");
    expect(porkbunCutover).toContain("/dns/create/");
    expect(porkbunCutover).toContain("secretsPrinted: false");
    expect(porkbunCutover).not.toContain("console.log(apikey");
    expect(porkbunCutover).not.toContain("console.log(secretapikey");
  });

  it("keeps Mac mini handoff redacted and tied to status, gate, and plan", () => {
    const handoff = readFileSync("scripts/mac-mini-handoff.mjs", "utf8");

    expect(handoff).toContain("mac-mini:status");
    expect(handoff).toContain("mac-mini:cutover-gate");
    expect(handoff).toContain("mac-mini:plan");
    expect(handoff).toContain("securityAudit");
    expect(handoff).toContain("approvalSteps");
    expect(handoff).toContain("warnings");
    expect(handoff).toContain("postCutoverReport");
    expect(handoff).toContain("writeOwnerOnlyFile");
    expect(handoff).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("keeps Mac mini next-action report read-only and prioritized before DNS", () => {
    const nextAction = readFileSync("scripts/mac-mini-next-action.mjs", "utf8");

    expect(nextAction).toContain("mac-mini:handoff");
    expect(nextAction).toContain("argValue");
    expect(nextAction).toContain("/tmp/alatau-supabase.env.todo");
    expect(nextAction).toContain("--prepared-env");
    expect(nextAction).toContain("supabase:env-audit");
    expect(nextAction).toContain("supabase:env-prepare");
    expect(nextAction).toContain("fillCommand");
    expect(nextAction).toContain("supabase:env-fill-interactive");
    expect(nextAction).toContain("supabase:env-fill-guide");
    expect(nextAction).toContain("supabase:env-postfill-gate");
    expect(nextAction).toContain("postfillGate");
    expect(nextAction).toContain("prepare-supabase-env");
    expect(nextAction).toContain("fill-prepared-supabase-env");
    expect(nextAction).toContain("install-prepared-supabase-env");
    expect(nextAction).toContain("preparedEnvAudit");
    expect(nextAction).toContain("install-supabase-env");
    expect(nextAction).toContain("npm run supabase:env-install:dry-run");
    expect(nextAction).toContain("MM-03");
    expect(nextAction).toContain("mac-mini:dns-cutover:dry-run");
    expect(nextAction).toContain("readOnly: true");
    expect(nextAction).toContain("secretsPrinted: false");
    expect(nextAction).not.toContain("ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute");
    expect(nextAction).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(nextAction).not.toContain("spawnSync(\"bash\"");
  });

  it("uses the shared arg parser for Mac mini host and DNS operator scripts", () => {
    const readiness = readFileSync("scripts/mac-mini-readiness.mjs", "utf8");
    const probe = readFileSync("scripts/mac-mini-network-probe.mjs", "utf8");
    const porkbunCutover = readFileSync("scripts/porkbun-dns-cutover.mjs", "utf8");

    expect(readiness).toContain("argValue");
    expect(readiness).toContain("argValue(\"--runtime-env-file\")");
    expect(probe).toContain("argValue");
    expect(probe).toContain("argValue(\"--timeout-ms\")");
    expect(porkbunCutover).toContain("argValue");
    expect(porkbunCutover).toContain("argValue(\"--secrets-env-file\")");
  });

  it("renders a read-only Mac mini operator checklist from handoff and next-action", () => {
    const checklist = readFileSync("scripts/mac-mini-operator-checklist.mjs", "utf8");

    expect(checklist).toContain("Mac Mini Operator Checklist");
    expect(checklist).toContain("argValue");
    expect(checklist).toContain("mac-mini:handoff");
    expect(checklist).toContain("mac-mini:next-action");
    expect(checklist).toContain("--prepared-env");
    expect(checklist).toContain("First Next Action");
    expect(checklist).toContain("Guide:");
    expect(checklist).toContain("Fill command:");
    expect(checklist).toContain("Post-fill gate:");
    expect(checklist).toContain("Approval Steps");
    expect(checklist).toContain("Hard Blockers");
    expect(checklist).toContain("Expected Pending Before DNS");
    expect(checklist).toContain("Read-only: yes");
    expect(checklist).toContain("Secrets printed: no");
    expect(checklist).toContain("Host/DNS/router mutations performed: no");
    expect(checklist).toContain("writeOwnerOnlyFile");
    expect(checklist).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(checklist).not.toContain("spawnSync(\"bash\"");
  });

  it("keeps lesson 3 homework status mapped to seven read-only user stories", () => {
    const lessonStatus = readFileSync("scripts/lesson3-status.mjs", "utf8");

    expect(lessonStatus).toContain("lesson-3-homework");
    expect(lessonStatus).toContain("argValue");
    expect(lessonStatus).toContain("unblocksForNextAction");
    expect(lessonStatus).toContain("immediateNextAction");
    expect(lessonStatus).toContain("lesson3:skill-gap");
    expect(lessonStatus).toContain("--prepared-env");
    expect(lessonStatus).toContain("--standalone-smoke");
    expect(lessonStatus).toContain("--guarded-dry-runs");
    expect(lessonStatus).toContain("standaloneSmoke");
    expect(lessonStatus).toContain("guardedDryRuns");
    expect(lessonStatus).toContain("readOptionalJson");
    expect(lessonStatus).toContain("--accept-web-audit-fallback");
    expect(lessonStatus).toContain("fallbackAccepted: acceptedSeoFallback");
    expect(lessonStatus).toContain("fallbackPrincipalTrigger");
    expect(lessonStatus).toContain("preparedEnv: preparedEnvPath");
    expect(lessonStatus).toContain("US-01");
    expect(lessonStatus).toContain("US-07");
    expect(lessonStatus).toContain("create-skill");
    expect(lessonStatus).toContain("chip-webb");
    expect(lessonStatus).toContain("seo-aeo-geo-principal");
    expect(lessonStatus).toContain("web-audit");
    expect(lessonStatus).toContain("vpsRequired: false");
    expect(lessonStatus).toContain("macMiniEquivalents");
    expect(lessonStatus).toContain("Next.js standalone output is managed by launchd");
    expect(lessonStatus).toContain("fallback");
    expect(lessonStatus).toContain("mac-mini:handoff");
    expect(lessonStatus).toContain("mac-mini:next-action");
    expect(lessonStatus).toContain("readOnly: true");
    expect(lessonStatus).toContain("secretsPrinted: false");
    expect(lessonStatus).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("keeps lesson 3 skill-gap audit read-only and explicit about the SEO fallback", () => {
    const skillGap = readFileSync("scripts/lesson3-skill-gap.mjs", "utf8");

    expect(skillGap).toContain("lesson-3-skill-gap");
    expect(skillGap).toContain("create-skill");
    expect(skillGap).toContain("chip-webb");
    expect(skillGap).toContain("seo-aeo-geo-principal");
    expect(skillGap).toContain("web-audit");
    expect(skillGap).toContain("--accept-web-audit-fallback");
    expect(skillGap).toContain("principalTrigger");
    expect(skillGap).toContain("providesPrincipalTrigger");
    expect(skillGap).toContain("readFileSync");
    expect(skillGap).toContain("readOnly: true");
    expect(skillGap).toContain("installsSkills: false");
    expect(skillGap).toContain("secretsPrinted: false");
    expect(skillGap).not.toContain("npm install");
    expect(skillGap).not.toContain("git clone");
  });

  it("renders lesson 3 report from the read-only status source", () => {
    const report = readFileSync("scripts/lesson3-report.mjs", "utf8");

    expect(report).toContain("lesson3:status");
    expect(report).toContain("argValue");
    expect(report).toContain("--prepared-env");
    expect(report).toContain("--standalone-smoke");
    expect(report).toContain("--guarded-dry-runs");
    expect(report).toContain("Standalone smoke:");
    expect(report).toContain("Guarded dry-runs:");
    expect(report).toContain("--accept-web-audit-fallback");
    expect(report).toContain("Prepared env:");
    expect(report).toContain("# Lesson 3 Homework Status");
    expect(report).toContain("## Next Action");
    expect(report).toContain("Unblocks:");
    expect(report).toContain("Evidence source:");
    expect(report).toContain("Guide:");
    expect(report).toContain("Fill command:");
    expect(report).toContain("Post-fill gate:");
    expect(report).toContain("## Completion Audit");
    expect(report).toContain("/tmp/alatau-lesson3-completion-audit.json");
    expect(report).toContain("## User Stories");
    expect(report).toContain("Notes:");
    expect(report).toContain("Secrets printed");
    expect(report).toContain("writeOwnerOnlyFile");
    expect(report).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("documents the accepted web-audit fallback in operator commands", () => {
    const readme = readFileSync("README.md", "utf8");
    const runbook = readFileSync("docs/ops/alatau-service-self-host-runbook.md", "utf8");

    for (const doc of [readme, runbook]) {
      expect(doc).toContain("lesson3:skill-gap -- --accept-web-audit-fallback");
      expect(doc).toContain("lesson3:status -- --accept-web-audit-fallback");
      expect(doc).toContain("lesson3:completion-audit -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback");
      expect(doc).toContain("lesson3:bundle -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback");
      expect(doc).toContain("--include-guarded-dry-runs");
      expect(doc).toContain("lesson3:guarded-dry-runs");
      expect(doc).toContain("/tmp/alatau-guarded-dry-run-receipt.json");
      expect(doc).toContain("lesson3:operator-handoff");
      expect(doc).toContain("/tmp/alatau-lesson3-operator-handoff.md");
      expect(doc).toContain("web-audit");
      expect(doc).toContain("supabase:env-fill-interactive");
      expect(doc).toContain("supabase:env-postfill-gate");
    }
  });

  it("renders a Russian lesson 3 summary without secret values", () => {
    const ruSummary = readFileSync("scripts/lesson3-ru-summary.mjs", "utf8");

    expect(ruSummary).toContain("Урок 3: что сделано и что осталось");
    expect(ruSummary).toContain("argValue");
    expect(ruSummary).toContain("lesson3:status");
    expect(ruSummary).toContain("--prepared-env");
    expect(ruSummary).toContain("--standalone-smoke");
    expect(ruSummary).toContain("--guarded-dry-runs");
    expect(ruSummary).toContain("Standalone smoke:");
    expect(ruSummary).toContain("Guarded dry-runs:");
    expect(ruSummary).toContain("--accept-web-audit-fallback");
    expect(ruSummary).toContain("Prepared env:");
    expect(ruSummary).toContain("Mac mini M4 self-host");
    expect(ruSummary).toContain("VPS-пункты из урока перенесены на Mac mini");
    expect(ruSummary).toContain("Примечание:");
    expect(ruSummary).toContain("Следующий шаг");
    expect(ruSummary).toContain("Разблокирует:");
    expect(ruSummary).toContain("Источник:");
    expect(ruSummary).toContain("Guide:");
    expect(ruSummary).toContain("Fill command:");
    expect(ruSummary).toContain("Post-fill gate:");
    expect(ruSummary).toContain("Completion Audit");
    expect(ruSummary).toContain("/tmp/alatau-lesson3-completion-audit.json");
    expect(ruSummary).toContain("По пунктам домашки");
    expect(ruSummary).toContain("Secrets printed");
    expect(ruSummary).toContain("writeOwnerOnlyFile");
    expect(ruSummary).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(ruSummary).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");
  });

  it("writes a read-only lesson 3 completion audit before any done claim", () => {
    const audit = readFileSync("scripts/lesson3-completion-audit.mjs", "utf8");
    const pkg = readFileSync("package.json", "utf8");

    expect(pkg).toContain("lesson3:completion-audit");
    expect(audit).toContain("lesson-3-completion-audit");
    expect(audit).toContain("lesson3:status");
    expect(audit).toContain("--prepared-env");
    expect(audit).toContain("--standalone-smoke");
    expect(audit).toContain("--guarded-dry-runs");
    expect(audit).toContain("--accept-web-audit-fallback");
    expect(audit).toContain("STATUS-SOURCE");
    expect(audit).toContain("auditSource");
    expect(audit).toContain("immediateNextAction");
    expect(audit).toContain("completionGateAfterAction");
    expect(audit).toContain("evidenceStatus");
    expect(audit).toContain("missingByItem");
    expect(audit).toContain("requirementIds");
    expect(audit).toContain("completionBlockers");
    expect(audit).toContain("decision: requirements.length > 0 && notDone.length === 0 ? \"complete\" : \"not-complete\"");
    expect(audit).toContain("readOnly: true");
    expect(audit).toContain("secretsPrinted: false");
    expect(audit).toContain("installsEnv: false");
    expect(audit).toContain("hostDnsRouterMutations: false");
    expect(audit).toContain("writeOwnerOnlyFile");
    expect(audit).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(audit).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");
  });

  it("bundles lesson 3 and Mac mini reports without mutating runtime state", () => {
    const bundle = readFileSync("scripts/lesson3-bundle.mjs", "utf8");

    expect(bundle).toContain("lesson-3-artifact-bundle");
    expect(bundle).toContain("argValue");
    expect(bundle).toContain("--include-standalone-smoke");
    expect(bundle).toContain("--include-guarded-dry-runs");
    expect(bundle).toContain("includeStandaloneSmoke");
    expect(bundle).toContain("includeGuardedDryRuns");
    expect(bundle).toContain("commandTimeoutMs");
    expect(bundle).toContain("--command-timeout-ms");
    expect(bundle).toContain("timeout: commandTimeoutMs");
    expect(bundle).toContain("timedOut");
    expect(bundle).toContain("guardedDryRunsArtifact");
    expect(bundle).toContain("standaloneSmokeArtifact");
    expect(bundle).toContain("commands.splice(1, 0");
    expect(bundle).toContain("acceptWebAuditFallback");
    expect(bundle).toContain("--accept-web-audit-fallback");
    expect(bundle).toContain("lesson3:skill-gap");
    expect(bundle).toContain("lesson3:report");
    expect(bundle).toContain("lesson3:completion-audit");
    expect(bundle).toContain("lesson3:operator-handoff");
    expect(bundle).toContain("/tmp/alatau-lesson3-completion-audit.json");
    expect(bundle).toContain("/tmp/alatau-lesson3-operator-handoff.md");
    expect(bundle).toContain("id: \"lesson3-completion-audit\"");
    expect(bundle).toContain("id: \"lesson3-operator-handoff\"");
    expect(bundle).toContain("nonReadyIsExpected: true");
    expect(bundle).toContain("--prepared-env\", preparedEnv");
    expect(bundle).toContain("supabase:env-fill-guide");
    expect(bundle).toContain("supabase:env-postfill-gate");
    expect(bundle).toContain("mac-mini:next-action");
    expect(bundle).toContain("mac-mini:operator-checklist");
    expect(bundle).toContain("mac-mini:standalone-smoke");
    expect(bundle).toContain("/tmp/alatau-standalone-smoke.json");
    expect(bundle).toContain("mac-mini:status");
    expect(bundle).toContain("mac-mini:handoff");
    expect(bundle).toContain("lesson3:guarded-dry-runs");
    expect(bundle).toContain("/tmp/alatau-guarded-dry-run-receipt.json");
    expect(bundle).toContain("nonReadyIsExpected");
    expect(bundle).toContain("readOnly: !includeStandaloneSmoke");
    expect(bundle).toContain("secretsPrinted: false");
    expect(bundle).toContain("installsEnv: false");
    expect(bundle).toContain("hostDnsRouterMutations: false");
    expect(bundle).toContain("localBuildArtifactsWritten: includeStandaloneSmoke");
    expect(bundle).toContain("localLoopbackServerStarted: includeStandaloneSmoke");
    expect(bundle).toContain("writeOwnerOnlyFile");
    expect(bundle).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("keeps guarded Lesson 3 dry-run receipt reproducible and non-mutating", () => {
    const guarded = readFileSync("scripts/lesson3-guarded-dry-runs.mjs", "utf8");
    const pkg = readFileSync("package.json", "utf8");

    expect(pkg).toContain("lesson3:guarded-dry-runs");
    expect(guarded).toContain("lesson-3-guarded-dry-runs");
    expect(guarded).toContain("supabase:env-install:dry-run");
    expect(guarded).toContain("mac-mini:install:dry-run");
    expect(guarded).toContain("mac-mini:caddy:dry-run");
    expect(guarded).toContain("mac-mini:security-hardening:dry-run");
    expect(guarded).toContain("expectedBlock");
    expect(guarded).toContain("dryRunOnly: true");
    expect(guarded).toContain("hostMutations: false");
    expect(guarded).toContain("writeOwnerOnlyFile");
    expect(guarded).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("writes a concise Lesson 3 operator handoff without mutating host state", () => {
    const handoff = readFileSync("scripts/lesson3-operator-handoff.mjs", "utf8");
    const pkg = readFileSync("package.json", "utf8");

    expect(pkg).toContain("lesson3:operator-handoff");
    expect(handoff).toContain("Lesson 3 Operator Handoff");
    expect(handoff).toContain("lesson3:status");
    expect(handoff).toContain("Do Not Yet");
    expect(handoff).toContain("After Env Gate Is Green");
    expect(handoff).toContain("mac-mini:cutover-gate");
    expect(handoff).toContain("mac-mini:dns-cutover:dry-run");
    expect(handoff).toContain("lesson3:completion-audit");
    expect(handoff).toContain("Read-only: yes");
    expect(handoff).toContain("Secrets printed: no");
    expect(handoff).toContain("Host/DNS/router mutations performed: no");
    expect(handoff).toContain("writeOwnerOnlyFile");
    expect(handoff).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(handoff).not.toContain("EXAMPLE_SERVICE_ROLE_KEY");
  });

  it("audits lesson 3 handoff artifacts for owner-only permissions and secret-looking output", () => {
    const artifactAudit = readFileSync("scripts/lesson3-artifact-audit.mjs", "utf8");

    expect(artifactAudit).toContain("lesson-3-artifact-audit");
    expect(artifactAudit).toContain("argValue");
    expect(artifactAudit).toContain("--bundle");
    expect(artifactAudit).toContain("/tmp/alatau-lesson3-bundle-default.json");
    expect(artifactAudit).toContain("bundle.artifacts");
    expect(artifactAudit).toContain("artifactSource: \"bundle\"");
    expect(artifactAudit).toContain("missing-bundle");
    expect(artifactAudit).toContain("permissions-not-owner-only");
    expect(artifactAudit).toContain("secret-assignment");
    expect(artifactAudit).toContain("readOnly: true");
    expect(artifactAudit).toContain("secretsPrinted: false");
    expect(artifactAudit).toContain("writeOwnerOnlyFile");
    expect(artifactAudit).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("keeps Mac mini network probe read-only and explicit about NAT hairpin uncertainty", () => {
    const probe = readFileSync("scripts/mac-mini-network-probe.mjs", "utf8");

    expect(probe).toContain("argValue");
    expect(probe).toContain("lsof");
    expect(probe).toContain("dig");
    expect(probe).toContain("ifconfig.me");
    expect(probe).toContain("timeoutMs");
    expect(probe).toContain("timeout: timeoutMs");
    expect(probe).toContain("NAT hairpin");
    expect(probe).not.toContain("launchctl bootstrap");
    expect(probe).not.toContain("brew install");
  });

  it("lets standalone smoke write a redacted receipt artifact", () => {
    const smoke = readFileSync("scripts/standalone-smoke.mjs", "utf8");

    expect(smoke).toContain("--out");
    expect(smoke).toContain("argValue");
    expect(smoke).toContain("generatedAt");
    expect(smoke).toContain("localLoopbackServerStarted");
    expect(smoke).toContain("writeOwnerOnlyFile");
    expect(smoke).toContain("DATA_BACKEND: \"memory\"");
    expect(smoke).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("bounds Mac mini readiness probes so operator handoffs do not hang", () => {
    const readiness = readFileSync("scripts/mac-mini-readiness.mjs", "utf8");

    expect(readiness).toContain("probeTimeoutMs");
    expect(readiness).toContain("timeout: probeTimeoutMs");
    expect(readiness).toContain("AbortSignal.timeout(probeTimeoutMs)");
  });

  it("includes the Mac mini security audit in status without mutating host settings", () => {
    const status = readFileSync("scripts/mac-mini-status.mjs", "utf8");
    const securityAudit = readFileSync("scripts/mac-mini-security-audit.mjs", "utf8");

    expect(status).toContain("security-audit");
    expect(status).toContain("mac-mini:security-audit");
    expect(status).toContain("Array.isArray(check.json?.checks)");
    expect(securityAudit).toContain("--getglobalstate");
    expect(securityAudit).toContain("-getremotelogin");
    expect(securityAudit).not.toContain("--setglobalstate");
    expect(securityAudit).not.toContain("-setremotelogin");
  });

  it("keeps Mac mini security hardening guarded behind explicit confirmation", () => {
    const hardening = readFileSync("ops/mac-mini-security-hardening.sh", "utf8");

    expect(hardening).toContain("--execute");
    expect(hardening).toContain("ALATAU_SECURITY_HARDENING_CONFIRMED");
    expect(hardening).toContain("blocked: real security hardening requires ALATAU_SECURITY_HARDENING_CONFIRMED=1");
    expect(hardening).toContain("--setglobalstate on");
    expect(hardening).toContain("--setstealthmode on");
    expect(hardening).toContain("--disable-remote-login");
    expect(hardening).toContain("remote login unchanged");
    expect(hardening).toContain("npm run mac-mini:security-audit");
  });

  it("keeps post-cutover live acceptance guarded because it posts a smoke lead", () => {
    const postCutover = readFileSync("scripts/mac-mini-post-cutover.mjs", "utf8");

    expect(postCutover).toContain("--execute");
    expect(postCutover).toContain("ALATAU_POST_CUTOVER_CONFIRMED");
    expect(postCutover).toContain("blocked: post-cutover execute requires ALATAU_POST_CUTOVER_CONFIRMED=1");
    expect(postCutover).toContain("rerun with ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover");
    expect(postCutover).toContain("--require-live-db");
    expect(postCutover).toContain("--post-lead");
    expect(postCutover).toContain("writesSmokeLead");
    expect(postCutover).toContain("writeOwnerOnlyFile");
  });

  it("passes the same runtime env file from Mac mini install into deploy", () => {
    const install = readFileSync("ops/mac-mini-install.sh", "utf8");

    expect(install).toContain("runtime_env_file");
    expect(install).toContain("blocked: --skip-readiness is allowed only in dry-run mode");
    expect(install).toContain("npm run mac-mini:readiness -- --runtime-env-file=\"$runtime_env_file\"");
    expect(install).toContain("ALATAU_RELEASE_ROOT=\"$release_root\" ALATAU_CURRENT_LINK=\"$current_link\" ALATAU_SUPABASE_ENV_FILE=\"$runtime_env_file\" bash ops/deploy.sh --dry-run");
    expect(install).toContain("ALATAU_SUPABASE_ENV_FILE=\"$runtime_env_file\"");
    expect(install).toContain("npm run supabase:env-audit -- --file \"$runtime_env_file\"");
    expect(install).toContain("render_launch_agent");
    expect(install).toContain("xml_escape");
    expect(install).toContain("source \\\"$runtime_env_file\\\"");
    expect(install).toContain("node \\\"$server_js\\\"");
    expect(install).toContain("rendered launchd plist validation");
    expect(install).toContain("install -m 644 \"$rendered_launch_agent\" \"$launch_agent\"");
    expect(install).not.toContain("cp ops/alatau-service.launchd.plist.example \"$launch_agent\"");
  });
});
