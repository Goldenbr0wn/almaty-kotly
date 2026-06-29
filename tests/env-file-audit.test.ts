import { describe, expect, it } from "vitest";
import { auditEnvFile } from "@/lib/system/env-file-audit";

describe("env file audit", () => {
  it("reports permissions, missing keys, and placeholders without leaking values", () => {
    const audit = auditEnvFile({
      path: "/Users/azat/.codex/secrets/alatau-supabase.env",
      exists: true,
      mode: 0o644,
      requiredKeys: ["DATA_BACKEND", "ADMIN_EMAILS", "SUPABASE_DB_URL"],
      keys: {
        DATA_BACKEND: "postgres",
        ADMIN_EMAILS: "owner@example.com",
        SUPABASE_DB_URL: "postgresql://postgres.PROJECT_REF:SECRET_PASSWORD@example.com/postgres"
      }
    });

    expect(audit.ok).toBe(false);
    expect(audit.permissions.mode).toBe("0644");
    expect(audit.permissions.ownerOnly).toBe(false);
    expect(audit.keys.find((key) => key.name === "SUPABASE_DB_URL")?.placeholder).toBe(true);
    expect(audit.nextActions).toContain("chmod 600 /Users/azat/.codex/secrets/alatau-supabase.env");
    expect(audit.nextActions.join("\n")).toContain("replace placeholder-looking values for keys: ADMIN_EMAILS, SUPABASE_DB_URL");
    expect(JSON.stringify(audit)).not.toContain("SECRET_PASSWORD");
  });

  it("passes when file exists, permissions are owner-only, and required keys are real-looking", () => {
    const audit = auditEnvFile({
      path: "/Users/azat/.codex/secrets/alatau-supabase.env",
      exists: true,
      mode: 0o600,
      requiredKeys: ["DATA_BACKEND", "ADMIN_EMAILS", "SUPABASE_DB_URL"],
      keys: {
        DATA_BACKEND: "postgres",
        ADMIN_EMAILS: "admin@alatau-service.com",
        SUPABASE_DB_URL: "postgresql://configured-db-url"
      }
    });

    expect(audit.ok).toBe(true);
    expect(audit.blockers).toEqual([]);
    expect(audit.nextActions).toEqual([]);
  });

  it("blocks test, fake, and synthetic placeholder values", () => {
    const audit = auditEnvFile({
      path: "/tmp/alatau-supabase.env.todo",
      exists: true,
      mode: 0o600,
      requiredKeys: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL"],
      keys: {
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "TEST-TOKEN-NOT-REAL-ANON-KEY",
        SUPABASE_SERVICE_ROLE_KEY: "fake-service-role-key",
        SUPABASE_DB_URL: "synthetic-db-url-marker"
      }
    });

    expect(audit.ok).toBe(false);
    expect(audit.keys.every((key) => key.placeholder)).toBe(true);
    expect(audit.blockers).toContain(
      "placeholder-looking values remain for keys: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL"
    );
  });
});
