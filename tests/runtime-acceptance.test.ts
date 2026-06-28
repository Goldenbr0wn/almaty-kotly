import { describe, expect, it } from "vitest";
import { evaluateRuntimeAcceptance } from "@/lib/system/runtime-acceptance";

const okRoutes = [
  { path: "/", status: 200 },
  { path: "/crm", status: 200 },
  { path: "/admin/leads", status: 200 },
  { path: "/admin/system", status: 200 },
  { path: "/profile", status: 200 },
  { path: "/api/health", status: 200 },
  { path: "/api/system/status", status: 200 },
  { path: "/release.json", status: 200 }
];

describe("runtime acceptance", () => {
  it("passes regular smoke when all routes and database health are ok", () => {
    const result = evaluateRuntimeAcceptance({
      routes: okRoutes,
      system: { ok: true, status: { backend: "memory", database: { ok: true, backend: "memory" } } },
      requireLiveDb: false
    });

    expect(result.ok).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("fails strict live database gate while runtime is memory-backed", () => {
    const result = evaluateRuntimeAcceptance({
      routes: okRoutes,
      system: { ok: true, status: { backend: "memory", database: { ok: true, backend: "memory" } } },
      requireLiveDb: true
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("live database required but active backend is memory");
  });

  it("fails when the storefront page does not include the final visual bundle", () => {
    const result = evaluateRuntimeAcceptance({
      routes: okRoutes,
      system: { ok: true, status: { backend: "memory", database: { ok: true, backend: "memory" } } },
      requireLiveDb: false,
      homeHtml: "<!doctype html><html><body><h1>Котлы под контролем</h1></body></html>"
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("home page is missing final storefront css bundle");
    expect(result.blockers).toContain("home page is missing final storefront js bundle");
  });
});
