import { describe, expect, it } from "vitest";
import { evaluateCutoverReadiness } from "@/lib/system/cutover-readiness";

describe("cutover readiness", () => {
  it("combines env and runtime blockers without leaking values", () => {
    const result = evaluateCutoverReadiness({
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
      acceptance: {
        ok: false,
        blockers: ["live database required but active backend is memory"]
      }
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("supabase env missing: SUPABASE_SERVICE_ROLE_KEY");
    expect(result.blockers).toContain("live database required but active backend is memory");
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });

  it("treats memory env mode as pending supabase cutover", () => {
    const result = evaluateCutoverReadiness({
      env: {
        backend: "memory",
        supabase: { ready: false, missing: ["NEXT_PUBLIC_SUPABASE_URL"] },
        postgres: { ready: false, missing: ["SUPABASE_DB_URL"] }
      },
      runtime: { ok: true, backend: "memory", database: { ok: true, backend: "memory" } },
      acceptance: { ok: false, blockers: ["live database required but active backend is memory"] }
    });

    expect(result.blockers).toContain("supabase env missing: NEXT_PUBLIC_SUPABASE_URL");
    expect(result.blockers).not.toContain("memory env missing: NEXT_PUBLIC_SUPABASE_URL");
  });
});
