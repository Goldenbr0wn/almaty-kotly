import { describe, expect, it } from "vitest";
import { buildMacMiniInstallPlan } from "@/lib/system/mac-mini-install-plan";

describe("mac mini install plan", () => {
  it("orders safe checks before host, network, and DNS mutations", () => {
    const plan = buildMacMiniInstallPlan({
      domain: "alatau-service.com",
      localIp: "192.168.8.12",
      appPort: "5173",
      releaseRoot: "/Users/azat/Services/alatau-service/releases",
      currentLink: "/Users/azat/Services/alatau-service/current",
      envFile: "/Users/azat/.codex/secrets/alatau-supabase.env",
      launchdLabel: "com.alatau-service.web"
    });

    expect(plan.steps.map((step) => step.id)).toEqual([
      "MM-01",
      "MM-02",
      "MM-03",
      "MM-04",
      "MM-05",
      "MM-06",
      "MM-07",
      "MM-08",
      "MM-09",
      "MM-10",
      "MM-11",
      "MM-12",
      "MM-13",
      "MM-14",
      "MM-15",
      "MM-16",
      "MM-17"
    ]);
    expect(plan.steps.slice(0, 2).every((step) => step.safety === "read-only")).toBe(true);
    expect(plan.steps.find((step) => step.id === "MM-01")?.command).toContain("--runtime-env-file=/Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plan.steps.find((step) => step.id === "MM-03")?.command).toBe("ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source /path/to/filled-alatau-supabase.env --target /Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plan.steps.find((step) => step.id === "MM-06")?.command).toBe("npm run mac-mini:security-audit");
    expect(plan.steps.find((step) => step.id === "MM-07")?.command).toBe("ALATAU_SECURITY_HARDENING_CONFIRMED=1 bash ops/mac-mini-security-hardening.sh --execute");
    expect(plan.steps.find((step) => step.id === "MM-15")?.command).toBe("npm run mac-mini:cutover-gate");
    expect(plan.steps.find((step) => step.id === "MM-15")?.safety).toBe("read-only");
    expect(plan.steps.filter((step) => step.requiresApproval).map((step) => step.id)).toEqual([
      "MM-03",
      "MM-07",
      "MM-09",
      "MM-10",
      "MM-11",
      "MM-12",
      "MM-13",
      "MM-14",
      "MM-16",
      "MM-17"
    ]);
    expect(plan.steps.find((step) => step.id === "MM-08")?.command).toContain("ALATAU_SUPABASE_ENV_FILE=/Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plan.steps.find((step) => step.id === "MM-10")?.command).toContain("ALATAU_DEPLOY_CONFIRMED=1");
    expect(plan.steps.find((step) => step.id === "MM-10")?.command).toContain("ALATAU_SUPABASE_ENV_FILE=/Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plan.steps.find((step) => step.id === "MM-11")?.label).toBe("Install rendered launchd service");
    expect(plan.steps.find((step) => step.id === "MM-11")?.command).toContain("bash ops/mac-mini-install.sh --execute");
    expect(plan.steps.find((step) => step.id === "MM-11")?.command).toContain("ALATAU_CURRENT_LINK=/Users/azat/Services/alatau-service/current");
    expect(plan.steps.find((step) => step.id === "MM-11")?.command).toContain("ALATAU_SUPABASE_ENV_FILE=/Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plan.steps.find((step) => step.id === "MM-11")?.note).toContain("renders the plist");
    expect(plan.steps.find((step) => step.id === "MM-12")?.label).toBe("Install and validate Caddy reverse proxy");
    expect(plan.steps.find((step) => step.id === "MM-12")?.command).toBe("bash ops/caddy-install.sh --execute");
    expect(plan.steps.find((step) => step.id === "MM-13")?.command).toBe("ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute");
    expect(plan.steps.find((step) => step.id === "MM-16")?.command).toBe("ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute");
    expect(plan.steps.find((step) => step.id === "MM-17")?.command).toBe("ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json");
    expect(plan.steps.find((step) => step.id === "MM-17")?.safety).toBe("production-smoke-write");
    expect(JSON.stringify(plan)).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });
});
