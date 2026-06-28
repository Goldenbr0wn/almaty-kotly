export type SchemaPreflightInput = {
  tables: {
    leads: boolean;
    lead_events: boolean;
    admin_users: boolean;
  };
  activeAdminCount: number;
};

export type SchemaPreflightResult = {
  ok: boolean;
  blockers: string[];
};

export function evaluateSchemaPreflight(input: SchemaPreflightInput): SchemaPreflightResult {
  const blockers: string[] = [];
  for (const [name, exists] of Object.entries(input.tables)) {
    if (!exists) blockers.push(`public.${name} not found`);
  }
  if (input.activeAdminCount < 1) blockers.push("active admin_users count is 0");
  return {
    ok: blockers.length === 0,
    blockers
  };
}
