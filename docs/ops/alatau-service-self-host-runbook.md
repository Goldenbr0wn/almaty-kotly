# Alatau Service Backend Runbook

Target domain: `https://alatau-service.com/`

Runtime target: Mac mini reverse-proxied to Next.js on `127.0.0.1:5173`.

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to a local secret source and replace placeholders outside git.
3. Run `npm run dev`.
4. Check `http://127.0.0.1:5173/api/health` and `http://127.0.0.1:5173/release.json`.

## Data Authority

- `DATA_BACKEND=memory` is for local UI/API work only.
- `DATA_BACKEND=supabase` requires managed Supabase env vars injected at runtime.
- Public form writes through `/api/leads`; browser clients never receive service-role credentials.
- Admin auth is server-side and constrained by `ADMIN_EMAILS`.

## Supabase

Run locally, if Supabase CLI is available:

```bash
supabase db reset
```

Check a managed/live Supabase runtime without printing secret values:

```bash
npm run supabase:migrate -- --env-file /path/to/alatau-supabase.env
npm run supabase:preflight -- --env-file /path/to/alatau-supabase.env
```

Run the local production-like server against Supabase:

```bash
PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env
```

One-command local cutover on port `5173`:

```bash
PORT=5173 npm run supabase:cutover-local -- --env-file /path/to/alatau-supabase.env
```

Cutover order:

1. apply SQL migration and seed `ADMIN_EMAILS`
2. verify Supabase REST schema
3. build and prepare standalone assets
4. stop only the listener on port `5173`
5. start the standalone server with `DATA_BACKEND=supabase`

Required keys in that env source:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `DATA_BACKEND=supabase`
- `SUPABASE_DB_URL` for direct SQL migration without Supabase CLI

Minimal direct database mode:

```bash
DATA_BACKEND=postgres PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env
```

This requires `SUPABASE_DB_URL` and `ADMIN_EMAILS`; full Supabase REST/Auth mode additionally requires the public URL, anon key, and service role key.

Managed Supabase production migration must be performed only after exact approval, with project ref and backup state confirmed.

## Deploy

Dry-run:

```bash
bash ops/deploy.sh --dry-run
```

Real deploy requires clean git tree, runtime secrets in the host secret store, reverse proxy configured, and explicit approval for production mutation.

## Rollback

Dry-run:

```bash
bash ops/rollback.sh --dry-run
```

Rollback only switches the app release symlink. Database migrations require a separate reviewed rollback plan.

## Smoke

Local:

```bash
bash ops/healthcheck.sh --local
```

Production after approved cutover:

```bash
bash ops/healthcheck.sh --production
```

## Approval Boundaries

Do not mutate DNS, router forwarding, managed Supabase production, launchd services, or real Telegram notifications without a separate exact approval.
