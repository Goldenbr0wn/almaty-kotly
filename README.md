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
npm run supabase:readiness -- --base-url http://localhost:5173 --runtime-env-file /path/to/alatau-supabase.env
npm run supabase:readiness -- --base-url http://localhost:5173 --runtime-env-file /path/to/alatau-supabase.env --out /tmp/alatau-readiness.json
npm run lesson3:skill-gap -- --accept-web-audit-fallback
npm run lesson3:status -- --accept-web-audit-fallback
npm run lesson3:report -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-report.md
npm run lesson3:ru-summary -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-ru-summary.md
npm run lesson3:completion-audit -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-completion-audit.json
npm run lesson3:skill-verify -- --out /tmp/alatau-lesson3-skill-verify.json
npm run lesson3:screen-checklist -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-screen-checklist.json
npm run lesson3:server-doctor-equivalent -- --out /tmp/alatau-lesson3-server-doctor-equivalent.json
npm run lesson3:approval-packet -- --out /tmp/alatau-lesson3-approval-packet.json
npm run lesson3:cutover-handoff -- --out /tmp/alatau-lesson3-cutover-handoff.md
npm run lesson3:checkbox-guide -- --out /tmp/alatau-lesson3-checkbox-guide.md
npm run lesson3:bundle -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-bundle-default.json
npm run lesson3:bundle -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --include-standalone-smoke --out /tmp/alatau-lesson3-bundle.json
npm run lesson3:bundle -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --include-standalone-smoke --include-guarded-dry-runs --out /tmp/alatau-lesson3-bundle-full.json
npm run lesson3:artifact-audit -- --bundle /tmp/alatau-lesson3-bundle-default.json --out /tmp/alatau-lesson3-artifact-audit.json
npm run lesson3:artifact-audit -- --bundle /tmp/alatau-lesson3-bundle-full.json --out /tmp/alatau-lesson3-artifact-audit-full.json
npm run lesson3:guarded-dry-runs -- --prepared-env /tmp/alatau-supabase.env.todo --out /tmp/alatau-guarded-dry-run-receipt.json
npm run lesson3:operator-handoff -- --prepared-env /tmp/alatau-supabase.env.todo --standalone-smoke /tmp/alatau-standalone-smoke.json --guarded-dry-runs /tmp/alatau-guarded-dry-run-receipt.json --accept-web-audit-fallback --out /tmp/alatau-lesson3-operator-handoff.md
npm run supabase:env-prepare -- --out /tmp/alatau-supabase.env.todo
npm run supabase:env-fill-guide -- --file /tmp/alatau-supabase.env.todo --out /tmp/alatau-supabase-env-fill-guide.md
npm run supabase:env-fill-interactive -- --file /tmp/alatau-supabase.env.todo
npm run supabase:env-postfill-gate -- --file /tmp/alatau-supabase.env.todo --out /tmp/alatau-supabase-env-postfill.json
npm run supabase:env-status -- --runtime-env-file /path/to/alatau-supabase.env
npm run supabase:env-audit -- --file /path/to/alatau-supabase.env
npm run supabase:env-install:dry-run -- --source /path/to/filled-alatau-supabase.env
npm run supabase:migrate -- --runtime-env-file /path/to/alatau-supabase.env
npm run supabase:preflight -- --runtime-env-file /path/to/alatau-supabase.env
PORT=5173 npm run preview:supabase -- --runtime-env-file /path/to/alatau-supabase.env
npm run mac-mini:readiness
npm run mac-mini:plan
npm run mac-mini:templates
npm run mac-mini:status -- --out /tmp/alatau-mac-mini-status.json
npm run mac-mini:next-action
npm run mac-mini:next-action -- --prepared-env /tmp/alatau-supabase.env.todo
npm run mac-mini:operator-checklist -- --out /tmp/alatau-mac-mini-checklist.md
npm run mac-mini:operator-checklist -- --prepared-env /tmp/alatau-supabase.env.todo --out /tmp/alatau-mac-mini-checklist.md
npm run mac-mini:standalone-smoke -- --out /tmp/alatau-standalone-smoke.json
npm run mac-mini:install:dry-run
npm run mac-mini:caddy:dry-run
npm run mac-mini:caddy-service:dry-run
npm run mac-mini:network-probe
npm run mac-mini:security-audit
npm run mac-mini:security-hardening:dry-run
npm run mac-mini:dns-cutover:dry-run
npm run mac-mini:cutover-gate
npm run mac-mini:handoff -- --out /tmp/alatau-mac-mini-handoff.json
npm run mac-mini:post-cutover -- --out /tmp/alatau-post-cutover.json
```

Use `ops/alatau-supabase.env.template` as the placeholder-only reference for the real env file. Keep the filled file outside the repo or in a secret manager.
`npm run supabase:env-prepare -- --out /tmp/alatau-supabase.env.todo` creates a `0600` placeholder copy outside the repo for manual filling. It refuses to overwrite unless `--force` is passed and does not install or print secrets.
`npm run supabase:env-fill-guide -- --file /tmp/alatau-supabase.env.todo --out /tmp/alatau-supabase-env-fill-guide.md` renders a redacted checklist of required keys, current placeholder/missing status, where to find values in Supabase, and the commands to run after filling.
`npm run supabase:env-fill-interactive -- --file /tmp/alatau-supabase.env.todo` opens a local TTY-only helper for filling that candidate file. It writes the file with mode `0600`, refuses non-interactive output capture, hides sensitive prompts, installs nothing, and prints only key status.
`npm run supabase:env-postfill-gate -- --file /tmp/alatau-supabase.env.todo --out /tmp/alatau-supabase-env-postfill.json` audits the filled candidate and returns either the remaining fill-guide commands or the exact dry-run/install/readiness/preflight sequence. It is read-only and does not install the env file.
`npm run supabase:env-install:dry-run -- --source /path/to/filled-alatau-supabase.env` audits the filled source file, then previews installing it to `/Users/azat/.codex/secrets/alatau-supabase.env` with mode `0600`. Placeholder or incomplete env files are rejected in dry-run before any install command is shown. Real installation requires exact approval plus `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source /path/to/filled-alatau-supabase.env`.
`npm run mac-mini:readiness` checks for that runtime env file by path only; it does not read or print secret values.
`npm run supabase:env-status` prints only configured/missing key status, never secret values.
`npm run supabase:readiness` combines redacted env status with current localhost runtime status, final storefront asset checks, and CRM/Admin/Profile route smoke; it returns non-zero while live Supabase cutover is blocked.
`npm run lesson3:skill-gap -- --accept-web-audit-fallback` checks the lesson skills without installing anything. The exact `seo-aeo-geo-principal` skill is not installed, so this project intentionally accepts the installed `web-audit` skill as the SEO/AEO/GEO fallback.
`npm run lesson3:ru-summary -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-ru-summary.md` renders the same current status as a concise Russian answer: what is done, what remains, and the next action.
`npm run lesson3:completion-audit -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-completion-audit.json` writes a machine-readable audit of every homework requirement, evidence status, missing item, and completion blocker.
`npm run lesson3:skill-verify -- --out /tmp/alatau-lesson3-skill-verify.json` verifies the installed Lesson 3 public skill equivalents without mutating local state: the local `server-doctor` public-clean skill covers the `server-doctor-public` homework slot, `web-audit` declares `/seo-aeo-geo-principal`, and `chip-legal-web-rf` is present.
`npm run lesson3:screen-checklist -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-screen-checklist.json` maps the visible Human20 Lesson 3 screenshot checklist to local evidence, including installed skills, accepted `web-audit` replacement, Mac mini VPS-equivalent work, email plan, legal TODO, and remaining partial items.
`npm run lesson3:server-doctor-equivalent -- --out /tmp/alatau-lesson3-server-doctor-equivalent.json` runs the read-only Mac mini equivalent of the `server-doctor-public` VPS pass: status, network probe, and security audit, without mutating host, DNS, router, or secrets.
`npm run lesson3:approval-packet -- --out /tmp/alatau-lesson3-approval-packet.json` renders the exact approval-gated execute commands for the remaining hardening, launchd/Caddy, DNS, and post-cutover acceptance work. It is read-only and does not execute those commands.
`npm run lesson3:cutover-handoff -- --out /tmp/alatau-lesson3-cutover-handoff.md` renders the remaining router/DNS/post-cutover operator path: forward WAN 80/443 to the Mac mini, verify `ready-for-approved-dns-cutover`, run the guarded Porkbun DNS execute command only after exact approval, then run post-cutover acceptance before marking the final checkboxes.
`npm run lesson3:checkbox-guide -- --out /tmp/alatau-lesson3-checkbox-guide.md` renders a Human20-ready checklist: which visible Lesson 3 tasks can be checked now (`done` or accepted `equivalent`) and which must remain unchecked (`partial`).
`npm run lesson3:bundle -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-bundle-default.json` refreshes the redacted lesson report, skill gap, Supabase fill/postfill reports, Mac mini next-action, checklist, status, handoff, and one-page operator handoff artifacts in one read-only pass. Non-ready statuses are expected while cutover blockers remain. Add `--include-standalone-smoke` when you also want the bundle to build standalone assets, start a local `127.0.0.1` memory-backend server, save `/tmp/alatau-standalone-smoke.json`, and stop it. Add `--include-guarded-dry-runs` to also refresh `/tmp/alatau-guarded-dry-run-receipt.json`, which proves the guarded env install, Mac mini install, Caddy, and security hardening dry-runs block or preview changes without mutating host/DNS/router state. Pass `--command-timeout-ms 180000` to tune the per-command timeout for slow local machines.
`npm run lesson3:guarded-dry-runs -- --prepared-env /tmp/alatau-supabase.env.todo --out /tmp/alatau-guarded-dry-run-receipt.json` refreshes a compact owner-only receipt for the guarded dry-run gates used before real Mac mini cutover.
`npm run lesson3:operator-handoff -- --prepared-env /tmp/alatau-supabase.env.todo --standalone-smoke /tmp/alatau-standalone-smoke.json --guarded-dry-runs /tmp/alatau-guarded-dry-run-receipt.json --accept-web-audit-fallback --out /tmp/alatau-lesson3-operator-handoff.md` writes a one-page owner-only handoff with the first action, do-not-yet list, post-env command order, and evidence commands before any final done claim.
`npm run lesson3:artifact-audit -- --bundle /tmp/alatau-lesson3-bundle-default.json --out /tmp/alatau-lesson3-artifact-audit.json` checks that the artifacts listed by that bundle exist, are owner-only, and do not contain secret-looking assignment strings.
`npm run mac-mini:operator-checklist` renders the current handoff into a Markdown checklist with the first next action, approval steps, blockers, expected pre-DNS pending items, and warnings. It is read-only and can write to `/tmp/alatau-mac-mini-checklist.md` with owner-only permissions. Pass `--prepared-env /path/to/file` to make the first-action logic audit a non-default prepared env file.
`npm run mac-mini:next-action` checks `/tmp/alatau-supabase.env.todo` when it exists, or a custom file passed with `--prepared-env`. If the prepared file still contains placeholders, the next action becomes filling/auditing that file and running the post-fill gate; once its audit is green, the next action becomes installing that exact file into the Mac mini secret store.
Use `--out /tmp/alatau-readiness.json` to save the same redacted report outside the repo.

One-command local cutover to Supabase on port `5173`:

```bash
PORT=5173 npm run supabase:cutover-local -- --runtime-env-file /path/to/alatau-supabase.env --dry-run
PORT=5173 npm run supabase:cutover-local -- --runtime-env-file /path/to/alatau-supabase.env
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
npm run security:scan
```

`security:scan` checks both tracked and untracked workspace files, excluding only gitignored files.

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
npm run mac-mini:readiness
npm run mac-mini:plan
npm run mac-mini:templates
npm run mac-mini:status -- --out /tmp/alatau-mac-mini-status.json
npm run mac-mini:next-action
npm run mac-mini:standalone-smoke -- --out /tmp/alatau-standalone-smoke.json
npm run mac-mini:install:dry-run
npm run mac-mini:caddy:dry-run
npm run mac-mini:caddy-service:dry-run
npm run mac-mini:network-probe
npm run mac-mini:security-audit
npm run mac-mini:security-hardening:dry-run
npm run mac-mini:dns-cutover:dry-run
npm run mac-mini:cutover-gate
npm run mac-mini:handoff -- --out /tmp/alatau-mac-mini-handoff.json
npm run mac-mini:post-cutover -- --out /tmp/alatau-post-cutover.json
```

Detailed runbook: `docs/ops/alatau-service-self-host-runbook.md`.

## Notes

- Prices are approximate and should be confirmed before production use.
- Product images are stored in `assets/boilers/` and copied to `public/assets/boilers/` for Next.js static serving.
- Image sources are listed in `assets/boilers/SOURCES.md`.
- Imagegen frontend section targets are stored in `design-targets/`.
- The included Codex skill lives in `codex-skill/almaty-kotly-baseline`.
- The visual system is adapted from `design-system/deck-card-presentation.DESIGN.md`.
