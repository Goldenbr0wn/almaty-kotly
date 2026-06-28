import { describe, expect, it } from "vitest";
import { getRuntimeSystemStatus, getSystemStatus } from "@/lib/system/status";

describe("system status", () => {
  it("reports supabase readiness without secret values", () => {
    const oldBackend = process.env.DATA_BACKEND;
    const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const oldAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const oldRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const oldAdmins = process.env.ADMIN_EMAILS;

    process.env.DATA_BACKEND = "supabase";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ADMIN_EMAILS;

    const status = getSystemStatus();
    expect(status.backend).toBe("supabase");
    expect(status.supabase.ready).toBe(false);
    expect(status.supabase.missing).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "ADMIN_EMAILS"
    ]);
    expect(JSON.stringify(status)).not.toContain("ey");
    expect(status.postgres.ready).toBe(false);
    expect(status.postgres.missing).toEqual(["SUPABASE_DB_URL", "ADMIN_EMAILS"]);

    restore("DATA_BACKEND", oldBackend);
    restore("NEXT_PUBLIC_SUPABASE_URL", oldUrl);
    restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", oldAnon);
    restore("SUPABASE_SERVICE_ROLE_KEY", oldRole);
    restore("ADMIN_EMAILS", oldAdmins);
  });

  it("includes active database health without exposing secret values", async () => {
    const oldBackend = process.env.DATA_BACKEND;
    const oldAdmins = process.env.ADMIN_EMAILS;
    const oldDbUrl = process.env.SUPABASE_DB_URL;

    process.env.DATA_BACKEND = "postgres";
    process.env.ADMIN_EMAILS = "owner@example.com";
    process.env.SUPABASE_DB_URL = "postgresql://postgres.PROJECT_REF:SECRET_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres";

    const status = await getRuntimeSystemStatus(async () => ({ ok: false, backend: "postgres" }));

    expect(status.backend).toBe("postgres");
    expect(status.activeStore.ready).toBe(true);
    expect(status.database).toEqual({ ok: false, backend: "postgres" });
    expect(status.ok).toBe(false);
    expect(JSON.stringify(status)).not.toContain("SECRET_PASSWORD");

    restore("DATA_BACKEND", oldBackend);
    restore("ADMIN_EMAILS", oldAdmins);
    restore("SUPABASE_DB_URL", oldDbUrl);
  });

  it("reports admin auth readiness without exposing allowlist emails", () => {
    const oldBackend = process.env.DATA_BACKEND;
    const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const oldAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const oldAdmins = process.env.ADMIN_EMAILS;

    process.env.DATA_BACKEND = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "SECRET_ANON";
    process.env.ADMIN_EMAILS = "owner@example.com,manager@example.com";

    const status = getSystemStatus();
    expect(status.adminAuth.ready).toBe(true);
    expect(status.adminAuth.adminCount).toBe(2);
    expect(status.adminAuth.missing).toEqual([]);
    expect(JSON.stringify(status)).not.toContain("owner@example.com");
    expect(JSON.stringify(status)).not.toContain("manager@example.com");
    expect(JSON.stringify(status)).not.toContain("SECRET_ANON");

    restore("DATA_BACKEND", oldBackend);
    restore("NEXT_PUBLIC_SUPABASE_URL", oldUrl);
    restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", oldAnon);
    restore("ADMIN_EMAILS", oldAdmins);
  });
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
