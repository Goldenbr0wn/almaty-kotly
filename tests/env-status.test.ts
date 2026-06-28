import { describe, expect, it } from "vitest";
import { buildEnvStatus } from "@/lib/system/env-status";

describe("env status", () => {
  it("reports configured keys without leaking values", () => {
    const status = buildEnvStatus({
      DATA_BACKEND: "postgres",
      ADMIN_EMAILS: "owner@example.com",
      SUPABASE_DB_URL: "postgresql://postgres.PROJECT_REF:SECRET_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "SECRET_ANON",
      SUPABASE_SERVICE_ROLE_KEY: ""
    });

    expect(status.backend).toBe("postgres");
    expect(status.postgres.ready).toBe(true);
    expect(status.supabase.ready).toBe(false);
    expect(status.supabase.missing).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
    expect(status.recommendedNextCommand).toContain("postgres:preflight");
    expect(JSON.stringify(status)).not.toContain("SECRET_PASSWORD");
    expect(JSON.stringify(status)).not.toContain("SECRET_ANON");
  });
});
