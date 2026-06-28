import type { DataBackend } from "@/lib/env";

export type CutoverPlanStep = {
  label: string;
  command?: string;
  destructive: boolean;
  skipped: boolean;
};

export type CutoverPlanInput = {
  backend: DataBackend;
  envFile: string;
  port: string;
  dryRun: boolean;
};

export type CutoverPlan = {
  backend: DataBackend;
  envFile: string;
  port: string;
  dryRun: boolean;
  preflightScript: string;
  steps: CutoverPlanStep[];
};

export function preflightScriptForBackend(backend: DataBackend): string {
  return backend === "postgres"
    ? "scripts/postgres-runtime-preflight.mjs"
    : "scripts/supabase-runtime-preflight.mjs";
}

export function buildCutoverPlan(input: CutoverPlanInput): CutoverPlan {
  const preflightScript = preflightScriptForBackend(input.backend);
  const skipDestructive = input.dryRun;

  return {
    ...input,
    preflightScript,
    steps: [
      { label: "apply Supabase migrations", command: `node scripts/apply-supabase-migrations.mjs --env-file ${input.envFile}`, destructive: false, skipped: false },
      { label: "verify data runtime", command: `node ${preflightScript} --env-file ${input.envFile}`, destructive: false, skipped: false },
      { label: "build app", command: "npm run build", destructive: false, skipped: false },
      { label: "prepare standalone", command: "npm run prepare:standalone", destructive: false, skipped: false },
      { label: "inspect current listener", command: `lsof -nP -iTCP:${input.port} -sTCP:LISTEN -t`, destructive: false, skipped: false },
      { label: "stop existing listener", command: `kill <listener-on-${input.port}>`, destructive: true, skipped: skipDestructive },
      { label: "write cutover receipt", command: "write .runtime/last-cutover.json", destructive: true, skipped: skipDestructive },
      { label: "start standalone server", command: "node .next/standalone/server.js", destructive: true, skipped: skipDestructive }
    ]
  };
}
