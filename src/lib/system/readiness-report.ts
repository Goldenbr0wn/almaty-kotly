type ReadinessReportInput = {
  ok: boolean;
  baseUrl: string;
  env: unknown;
  runtime: unknown;
  blockers: string[];
  next: string;
};

export type ReadinessReport = ReadinessReportInput & {
  generatedAt: string;
};

export function buildReadinessReport(input: ReadinessReportInput & Record<string, unknown>): ReadinessReport {
  return {
    ok: input.ok,
    baseUrl: input.baseUrl,
    env: input.env,
    runtime: input.runtime,
    blockers: input.blockers,
    next: input.next,
    generatedAt: new Date().toISOString()
  };
}
