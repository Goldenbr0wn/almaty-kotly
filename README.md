# Alatau Service Backend

Next.js backend v1 for the Almaty gas boiler service site at `alatau-service.com`.

The old static HTML baseline is still present for reference, but the active app is the Next.js App Router implementation in `app/` and `src/`.

## Features

- Public pages: `/`, `/catalog`, `/compare`, `/delivery-warranty`, `/request`
- Lead API: `POST /api/leads`
- Health, system, and release probes: `/api/health`, `/api/system/status`, `/release.json`
- Protected admin entry: `/admin/login`, `/admin/leads`
- System status includes admin auth readiness and admin allowlist count without printing email addresses.
- Supabase schema for `leads`, `lead_events`, and `admin_users`
- Mac mini self-host deploy, rollback, healthcheck, Caddy, and launchd templates in `ops/`

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Production-like local preview:

```bash
PORT=5173 DATA_BACKEND=memory LOCAL_ADMIN_EMAIL=owner@example.com ADMIN_EMAILS=owner@example.com npm run preview
```

Production-like Supabase preview, once a safe env file exists:

```bash
npm run supabase:readiness -- --base-url http://localhost:5173 --env-file /path/to/alatau-supabase.env
npm run supabase:readiness -- --base-url http://localhost:5173 --env-file /path/to/alatau-supabase.env --out /tmp/alatau-readiness.json
npm run supabase:env-status -- --env-file /path/to/alatau-supabase.env
npm run supabase:migrate -- --env-file /path/to/alatau-supabase.env
npm run supabase:preflight -- --env-file /path/to/alatau-supabase.env
PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env
```

Use `ops/alatau-supabase.env.template` as the placeholder-only reference for the real env file. Keep the filled file outside the repo or in a secret manager.
`npm run supabase:env-status` prints only configured/missing key status, never secret values.
`npm run supabase:readiness` combines redacted env status with current localhost runtime status, final storefront asset checks, and CRM/Admin/Profile route smoke; it returns non-zero while live Supabase cutover is blocked.
Use `--out /tmp/alatau-readiness.json` to save the same redacted report outside the repo.

One-command local cutover to Supabase on port `5173`:

```bash
PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env --dry-run
PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env
```

The cutover script applies migrations, verifies Supabase REST, builds the app, prepares standalone assets, then replaces only the process listening on port `5173`.
The dry run prints the planned steps and skips listener shutdown, receipt writing, and server start.
The Supabase/Postgres preflight checks `leads`, `lead_events`, `admin_users`, and at least one active admin bootstrap before cutover. The readiness command also confirms the final visual bundle and backend routes still answer on `localhost:5173`.

By default `DATA_BACKEND=memory` can be used for local development without real Supabase credentials. Production should use `DATA_BACKEND=supabase` with runtime-injected secrets.
`DATA_BACKEND=postgres` is also supported for direct writes to the Supabase Postgres database through `SUPABASE_DB_URL`.

## Verification

```bash
npm test -- --runInBand
npm run lint
npm run build
npm run runtime:acceptance -- --base-url=http://localhost:5173
```

After Supabase cutover, the final acceptance gate must pass with live database enforcement:

```bash
npm run runtime:acceptance -- --base-url=http://localhost:5173 --require-live-db
```

## Supabase

Schema lives in `supabase/migrations/202606280001_backend_v1.sql`.

Local reset, if Supabase CLI is available:

```bash
supabase db reset
```

Production migrations, DNS/router changes, launchd changes, and real Telegram notifications require separate exact approval.

## Ops

```bash
bash ops/deploy.sh --dry-run
bash ops/rollback.sh --dry-run
bash ops/healthcheck.sh --local
```

Detailed runbook: `docs/ops/alatau-service-self-host-runbook.md`.

## Notes

- Prices are approximate and should be confirmed before production use.
- Product images are stored in `assets/boilers/` and copied to `public/assets/boilers/` for Next.js static serving.
- Image sources are listed in `assets/boilers/SOURCES.md`.
- Imagegen frontend section targets are stored in `design-targets/`.
- The included Codex skill lives in `codex-skill/almaty-kotly-baseline`.
- The visual system is adapted from `design-system/deck-card-presentation.DESIGN.md`.
