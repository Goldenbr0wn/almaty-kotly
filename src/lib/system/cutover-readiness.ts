import type { DataBackend } from "@/lib/env";

type EnvReadiness = {
  backend: DataBackend;
  supabase: { ready: boolean; missing: string[] };
  postgres: { ready: boolean; missing: string[] };
};

type RuntimeReadiness = {
  ok: boolean;
  backend: string;
  database: { ok?: boolean; backend?: string } | null;
};

type AcceptanceReadiness = {
  ok: boolean;
  blockers: string[];
};

export type CutoverReadinessInput = {
  env: EnvReadiness;
  runtime: RuntimeReadiness;
  acceptance: AcceptanceReadiness;
};

export type CutoverReadinessResult = {
  ok: boolean;
  blockers: string[];
};

export function evaluateCutoverReadiness(input: CutoverReadinessInput): CutoverReadinessResult {
  const blockers: string[] = [];
  const targetBackend = input.env.backend === "postgres" ? "postgres" : "supabase";
  const envGroup = targetBackend === "postgres" ? input.env.postgres : input.env.supabase;

  if (!envGroup.ready) {
    blockers.push(`${targetBackend} env missing: ${envGroup.missing.join(", ")}`);
  }
  if (!input.runtime.ok) blockers.push("runtime system status is not ok");
  if (!input.runtime.database?.ok) blockers.push(`runtime database health failed for ${input.runtime.database?.backend || input.runtime.backend}`);
  blockers.push(...input.acceptance.blockers);

  return {
    ok: blockers.length === 0,
    blockers: [...new Set(blockers)]
  };
}
