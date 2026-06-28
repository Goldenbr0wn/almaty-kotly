type EnvGroup = {
  ready: boolean;
  missing: string[];
};

type ReadinessInput = {
  env: {
    backend: "memory" | "postgres" | "supabase";
    postgres: EnvGroup;
    supabase: EnvGroup;
  };
  runtime: {
    ok: boolean;
    backend?: string;
    database?: {
      ok?: boolean;
      backend?: string;
    } | null;
  };
  acceptance: {
    ok: boolean;
    blockers: string[];
  };
};

export function evaluateSupabaseReadiness(input: ReadinessInput) {
  const blockers: string[] = [];
  const targetBackend = input.env.backend === "postgres" ? "postgres" : "supabase";
  const envGroup = targetBackend === "postgres" ? input.env.postgres : input.env.supabase;

  if (!envGroup.ready) blockers.push(`${targetBackend} env missing: ${envGroup.missing.join(", ")}`);
  if (!input.runtime.ok) blockers.push("runtime system status is not ok");
  if (!input.runtime.database?.ok) {
    blockers.push(`runtime database health failed for ${input.runtime.database?.backend || input.runtime.backend || targetBackend}`);
  }
  blockers.push(...input.acceptance.blockers);

  return { ok: blockers.length === 0, blockers: [...new Set(blockers)] };
}
