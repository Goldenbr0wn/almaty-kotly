# Supabase Authority Report

Date: 2026-06-28

Current localhost runtime:

- `DATA_BACKEND=memory`
- `/api/health` reports `{"backend":"memory"}`

Live Supabase status:

- No `SUPABASE*` variables were present in the inspected shell environment.
- No Supabase-named secret file was found under `/Users/azat/.codex/secrets` by filename-only inspection.
- `supabase` CLI was not found in `PATH`.
- `/Users/azat/.hermes/.env` was inspected by variable names only and did not expose Supabase-related keys.
- `npm run supabase:preflight` exists and reports missing required env names without printing values.
- `npm run supabase:env-status` exists and reports configured/missing key names without printing values or making network calls.
- `npm run supabase:migrate` exists and can apply the local SQL migration through `SUPABASE_DB_URL` without requiring the Supabase CLI.
- `/admin/system` exposes the current backend mode and missing Supabase env names to the admin UI without printing secret values.
- `/api/system/status` exposes backend readiness and active database health as JSON for deployment smoke checks without printing secret values.
- `/api/system/status` exposes admin auth readiness and allowlist count without printing allowlist email values.
- `ops/alatau-supabase.env.template` provides a placeholder-only template for the real env file that must live outside the repo or in a secret manager.
- `DATA_BACKEND=postgres` is supported for direct writes to live Supabase Postgres via `SUPABASE_DB_URL` when REST/Auth keys are not yet available.
- `npm run postgres:preflight` checks direct Supabase Postgres schema readiness without printing the DB URL.
- Both Supabase REST and direct Postgres preflights now require `leads`, `lead_events`, `admin_users`, and at least one active admin bootstrap before cutover can pass.
- `npm run supabase:readiness` is a read-only cutover readiness report that combines redacted env status with current localhost runtime/backend status plus final storefront asset and CRM/Admin/Profile route smoke.
- `npm run supabase:readiness -- --out /tmp/alatau-readiness.json` can save the redacted readiness report outside the repository for operator handoff.
- `npm run runtime:acceptance -- --base-url=http://localhost:5173 --require-live-db` is the final proof command after cutover; current memory mode correctly fails that gate.
- `npm run supabase:cutover-local -- --dry-run` exposes the planned cutover sequence without touching the current listener.
- No secret values were read or printed.

Conclusion:

Live Supabase is not yet proven active on `http://localhost:5173/`. The app is ready to switch to `DATA_BACKEND=supabase` when a managed Supabase URL, anon key, service role key, and admin email allowlist are injected through a safe runtime secret source.

Exact blocker:

Missing configured live Supabase project credentials and/or approved local secret source for this project.

Ready command when credentials exist:

```bash
npm run supabase:env-status -- --env-file /path/to/alatau-supabase.env
npm run supabase:readiness -- --base-url http://localhost:5173 --env-file /path/to/alatau-supabase.env
npm run supabase:readiness -- --base-url http://localhost:5173 --env-file /path/to/alatau-supabase.env --out /tmp/alatau-readiness.json
npm run supabase:preflight -- --env-file /path/to/alatau-supabase.env
npm run supabase:migrate -- --env-file /path/to/alatau-supabase.env
DATA_BACKEND=postgres PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env
PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env
PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env --dry-run
PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env
npm run runtime:acceptance -- --base-url=http://localhost:5173 --require-live-db
```
