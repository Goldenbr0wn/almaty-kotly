import { describe, expect, it } from "vitest";
import { buildCutoverPlan } from "@/lib/system/cutover-plan";

describe("cutover plan", () => {
  it("marks destructive steps as skipped during dry run", () => {
    const plan = buildCutoverPlan({ backend: "postgres", envFile: "/tmp/alatau.env", port: "5173", dryRun: true });

    expect(plan.preflightScript).toBe("scripts/postgres-runtime-preflight.mjs");
    expect(plan.steps.map((step) => step.label)).toEqual([
      "apply Supabase migrations",
      "verify data runtime",
      "build app",
      "prepare standalone",
      "inspect current listener",
      "stop existing listener",
      "write cutover receipt",
      "start standalone server"
    ]);
    expect(plan.steps.filter((step) => step.destructive).every((step) => step.skipped)).toBe(true);
    expect(JSON.stringify(plan)).not.toContain("SECRET");
  });
});
