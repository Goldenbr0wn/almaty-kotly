# Final Handoff Snapshot

Date: 2026-06-28

What is now true:

- `http://localhost:5173/` renders the final `dist` visual site, not the temporary Next homepage.
- Final site CSS, JS, fonts, and image assets return HTTP 200.
- A small operator panel links to `/crm`, `/admin/leads`, and `/profile`.
- The final site's request form posts to `/api/leads`; a browser smoke created a lead with HTTP 201.
- `/crm`, `/admin/leads`, `/profile`, `/api/health`, `/api/system/status`, and `/release.json` return HTTP 200 in local preview.
- The new `.supergoal` package validates.
- Supabase env-status/migration/preflight/start/cutover scripts exist: `npm run supabase:env-status`, `npm run supabase:migrate`, `npm run supabase:preflight`, `npm run preview:supabase`, and `npm run supabase:cutover-local`.
- `/admin/system` shows backend mode, Supabase readiness, missing env names, and cutover commands without secret values.
- `/api/system/status` exposes the same readiness state as machine-readable JSON without secret values and includes active database health.
- `/api/system/status` and `/admin/system` expose admin auth readiness and admin allowlist count without printing allowlist emails.
- `ops/alatau-supabase.env.template` documents the required live Supabase env file shape with placeholders only.
- `npm run supabase:env-status -- --env-file /path/to/alatau-supabase.env` reports configured/missing key names without secret values.
- Direct Supabase Postgres mode exists as `DATA_BACKEND=postgres`, using `SUPABASE_DB_URL` for live database writes.
- `npm run runtime:acceptance -- --base-url=http://localhost:5173` verifies the public site, CRM/Admin/Profile, health, system status, and release routes.
- `npm run runtime:acceptance -- --base-url=http://localhost:5173 --require-live-db` is the final cutover gate; it intentionally fails while the backend is `memory`.
- `PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env --dry-run` prints the cutover plan and skips listener shutdown, receipt writing, and server start.
- `npm run postgres:preflight` and `npm run supabase:preflight` check `leads`, `lead_events`, `admin_users`, and at least one active admin before cutover.
- `npm run supabase:readiness -- --base-url http://localhost:5173 --env-file /path/to/alatau-supabase.env` is the read-only cutover command center; it combines env, runtime, final storefront asset, and CRM/Admin/Profile route blockers without secret values.
- `npm run supabase:readiness -- --base-url http://localhost:5173 --out /tmp/alatau-readiness.json` writes the same redacted report outside the repo for handoff.

Verification already run:

- `npm test -- --runInBand`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`
- `git diff --check`
- `npm run supabase:env-status`
- Browser smoke through local Chrome against `http://127.0.0.1:5173/`
- Route smoke against `http://localhost:5173/` including `/api/system/status`
- `npm run runtime:acceptance -- --base-url=http://localhost:5173`
- `npm run runtime:acceptance -- --base-url=http://localhost:5173 --require-live-db` currently fails with `live database required but active backend is memory`.
- `PORT=5173 npm run supabase:cutover-local -- --env-file ops/alatau-supabase.env.template --dry-run`
- `npm run postgres:preflight` and `npm run supabase:preflight` safe-fail on missing env names without secret values.
- `npm run supabase:readiness -- --base-url http://localhost:5173` currently checks `/`, final CSS/JS assets, CRM/Admin/Profile, health, system status, and release routes, then fails with missing Supabase env names and `live database required but active backend is memory`.
- `npm run supabase:readiness -- --base-url http://localhost:5173 --out /tmp/alatau-readiness.json` was verified and wrote a redacted JSON report.
- `/api/system/status` returns `database.ok` and `database.backend`; current preview reports `memory`.
- `/api/system/status` returns `adminAuth.ready`, `adminAuth.mode`, `adminAuth.adminCount`, and missing env names without email values.
- In-app browser check for styled final homepage, header, hero, and backend navigation

Remaining blocker:

Live Supabase is not active yet. Current runtime is memory-backed because no project credentials or approved secret source are configured in the inspected environment.
