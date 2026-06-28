import { describe, expect, it } from "vitest";
import { evaluateSchemaPreflight } from "@/lib/system/schema-preflight";

describe("schema preflight", () => {
  it("requires all runtime tables and at least one active admin", () => {
    const result = evaluateSchemaPreflight({
      tables: { leads: true, lead_events: true, admin_users: true },
      activeAdminCount: 0
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("active admin_users count is 0");
  });

  it("passes when tables and active admin bootstrap are present", () => {
    const result = evaluateSchemaPreflight({
      tables: { leads: true, lead_events: true, admin_users: true },
      activeAdminCount: 1
    });

    expect(result.ok).toBe(true);
    expect(result.blockers).toEqual([]);
  });
});
