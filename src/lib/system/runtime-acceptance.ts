export type RouteProbe = {
  path: string;
  status: number;
};

type SystemProbe = {
  ok?: boolean;
  status?: {
    backend?: string;
    database?: {
      ok?: boolean;
      backend?: string;
    };
  };
};

export type RuntimeAcceptanceInput = {
  routes: RouteProbe[];
  system: SystemProbe;
  requireLiveDb: boolean;
  homeHtml?: string;
};

export type RuntimeAcceptanceResult = {
  ok: boolean;
  blockers: string[];
};

export function evaluateRuntimeAcceptance(input: RuntimeAcceptanceInput): RuntimeAcceptanceResult {
  const blockers: string[] = [];

  for (const route of input.routes) {
    if (route.status < 200 || route.status >= 400) {
      blockers.push(`${route.path} returned ${route.status}`);
    }
  }

  const backend = input.system.status?.backend || "unknown";
  const database = input.system.status?.database;
  if (!input.system.ok) blockers.push("system status is not ok");
  if (!database?.ok) blockers.push(`database health failed for ${database?.backend || backend}`);
  if (input.requireLiveDb && backend === "memory") {
    blockers.push("live database required but active backend is memory");
  }
  if (input.homeHtml !== undefined) {
    if (!input.homeHtml.includes("index-mobilefix3-20260628.css")) {
      blockers.push("home page is missing final storefront css bundle");
    }
    if (!input.homeHtml.includes("index-mobilefix3-20260628.js")) {
      blockers.push("home page is missing final storefront js bundle");
    }
  }

  return {
    ok: blockers.length === 0,
    blockers
  };
}
