import { describe, expect, it } from "vitest";
import { buildReadinessReport } from "@/lib/system/readiness-report";

describe("readiness report", () => {
  it("serializes blockers without leaking secret values", () => {
    const report = buildReadinessReport({
      ok: false,
      baseUrl: "http://localhost:5173",
      env: {
        backend: "supabase",
        supabase: { ready: false, missing: ["SUPABASE_SERVICE_ROLE_KEY"] },
        postgres: { ready: true, missing: [] }
      },
      runtime: {
        ok: true,
        backend: "memory",
        database: { ok: true, backend: "memory" }
      },
      blockers: ["supabase env missing: SUPABASE_SERVICE_ROLE_KEY"],
      next: "Fix blockers",
      secretProbe: "SECRET_VALUE"
    });

    const serialized = JSON.stringify(report);
    expect(report.blockers).toContain("supabase env missing: SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).not.toContain("SECRET_VALUE");
  });
});
