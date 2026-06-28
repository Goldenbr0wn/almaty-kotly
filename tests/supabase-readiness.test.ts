import { describe, expect, it } from "vitest";
import { evaluateSupabaseReadiness } from "@/lib/system/supabase-readiness";

describe("supabase readiness", () => {
  it("includes runtime acceptance blockers in the cutover gate", () => {
    const result = evaluateSupabaseReadiness({
      env: {
        backend: "supabase",
        supabase: { ready: true, missing: [] },
        postgres: { ready: false, missing: ["SUPABASE_DB_URL"] }
      },
      runtime: {
        ok: true,
        backend: "supabase",
        database: { ok: true, backend: "supabase" }
      },
      acceptance: {
        ok: false,
        blockers: ["home page is missing final storefront css bundle"]
      }
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("home page is missing final storefront css bundle");
  });
});
