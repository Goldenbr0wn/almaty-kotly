# Alatau Service Backend Runbook

Target domain: `https://alatau-service.com/`

Runtime target: Mac mini M4 reverse-proxied to Next.js on `127.0.0.1:5173`.

Current public deployment may still point at Vercel while Mac mini cutover is being prepared. Treat Vercel as fallback/preview until DNS is intentionally moved.

## Mac Mini Target

- Host: `Mac-mini-Azat.local`
- Reserved LAN IP: `192.168.8.12`
- App port: `127.0.0.1:5173`
- Release root: `/Users/azat/Services/alatau-service/releases`
- Current symlink: `/Users/azat/Services/alatau-service/current`
- Logs: `/Users/azat/Services/alatau-service/logs`
- Launchd label: `com.alatau-service.web`

Read-only host readiness:

```bash
npm run lesson3:skill-gap -- --accept-web-audit-fallback
npm run lesson3:status -- --accept-web-audit-fallback
npm run lesson3:report -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-report.md
npm run lesson3:ru-summary -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-ru-summary.md
npm run lesson3:completion-audit -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-completion-audit.json
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

`mac-mini:readiness` checks the local host identity, LAN IP, runtime env file presence, Caddy availability, launchd service state, system sleep state, current DNS A records, ports `80`, `443`, `5173`, and the live `/api/health` backend mode. It prints blockers and safe `nextActions` without secret values.

`lesson3:skill-gap` checks only the lesson skill requirement. It is read-only, installs nothing, and reports whether `create-skill`, `chip-webb`, and the exact `seo-aeo-geo-principal` skill are present. The exact `seo-aeo-geo-principal` skill is not installed, so this project intentionally passes `--accept-web-audit-fallback` to accept the installed `web-audit` skill for the SEO/AEO/GEO lesson slot.

`lesson3:status` maps the lesson homework checklist into reproducible user-story statuses. It is read-only and summarizes skills, Mac mini server readiness, hardening, DNS/domain, backend SuperGoal, user-story verification, and final cutover readiness without printing secrets.

`lesson3:report` renders the same status into a Markdown report for handoff. It is read-only and can write to `/tmp/alatau-lesson3-report.md` with owner-only permissions.

`lesson3:ru-summary` renders the same status as a concise Russian answer for the operator: what is done, what remains, and the next action, without printing secret values.

`lesson3:completion-audit` writes a machine-readable audit of every homework requirement, evidence status, missing item, and completion blocker. It is read-only and is the final guard against claiming the lesson complete while any user story remains partial or blocked.

`lesson3:bundle` refreshes the complete redacted Lesson 3 handoff set in one read-only pass: skill gap, lesson report, Supabase fill guide, postfill gate, Mac mini next action, operator checklist, status, handoff, and one-page operator handoff. Commands that return non-zero because the site is not ready yet are recorded as expected non-ready states rather than treated as tool failures. Add `--include-standalone-smoke` when you also want the bundle to build standalone assets, start a local `127.0.0.1` memory-backend server, save `/tmp/alatau-standalone-smoke.json`, and stop it. Add `--include-guarded-dry-runs` to refresh `/tmp/alatau-guarded-dry-run-receipt.json`, which records the guarded env install, Mac mini install, Caddy, and security hardening dry-runs without host/DNS/router mutation. Pass `--command-timeout-ms 180000` to tune the per-command timeout for slow local machines.

`lesson3:guarded-dry-runs` runs the guarded pre-cutover dry-run gates and writes a compact owner-only receipt. It treats expected blocks, such as placeholder env values or missing Caddy/Homebrew, as useful evidence rather than as real mutations.

`lesson3:operator-handoff` writes a one-page owner-only Markdown handoff for the human operator. It keeps the current first action, do-not-yet guardrails, post-env command order, and final evidence commands together without printing secrets or mutating host, DNS, or router state.

`lesson3:artifact-audit` verifies that the artifacts listed by the selected bundle exist, are owner-only, and do not contain secret-looking assignment strings. It is read-only and writes its own owner-only audit receipt.

`supabase:env-prepare` creates a placeholder-only env file such as `/tmp/alatau-supabase.env.todo` with mode `0600` so the first blocker can be filled from the Supabase dashboard or secret manager outside the repository. It refuses to overwrite without `--force`, installs nothing, and does not print secret values.

`supabase:env-fill-guide` renders a redacted checklist for the prepared env file. It reports only key status such as configured, placeholder, or missing; it does not print values. Use it to fill the remaining placeholders from the Supabase dashboard or secret manager before running `supabase:env-audit`.

`supabase:env-fill-interactive` is an optional local helper for filling the prepared env file from a terminal. It requires a TTY, writes the candidate file with owner-only permissions, hides sensitive prompts, installs nothing, and prints only key status plus next commands.

`supabase:env-postfill-gate` is the read-only gate to run after filling a candidate env file. If audit still fails, it points back to the fill guide and audit command. If audit passes, it prints the exact dry-run install, guarded install, readiness, and preflight commands without printing secret values or mutating the host.

`supabase:env-install:dry-run` audits a filled env candidate, then previews installing it into `/Users/azat/.codex/secrets/alatau-supabase.env`. Placeholder or incomplete files are blocked during dry-run before any install command is shown. Execute mode requires `ALATAU_ENV_INSTALL_CONFIRMED=1` and repeats the source audit before any target write.

`mac-mini:plan` prints the ordered install/cutover checklist and labels which steps require explicit approval before writing outside the repository or changing host, network, or DNS state.

`mac-mini:templates` validates the launchd plist and, when Caddy is installed, validates the Caddyfile.

`mac-mini:status` aggregates env audit, host readiness, network probe, template validation, and the cutover plan into one redacted JSON report. It includes top-level `blockers`, `warnings`, and safe `nextActions` with key names and commands only, never secret values. Use `--out /tmp/alatau-mac-mini-status.json` for handoff artifacts outside the repository.

`mac-mini:next-action` reads the redacted handoff and returns the first priority action to work on, including the relevant dry-run command and approval step. It is read-only and is meant to keep operators from jumping to router or DNS changes before env, firewall, Caddy, and launchd blockers are cleared.
When `/tmp/alatau-supabase.env.todo` exists, `mac-mini:next-action` audits that prepared file without printing values. Pass `--prepared-env /path/to/file` to audit a non-default prepared env file. Placeholder or incomplete prepared files route the next action to filling/auditing the prepared file and running `supabase:env-postfill-gate`; a green prepared-file audit routes the next action to installing that exact file into `/Users/azat/.codex/secrets/alatau-supabase.env`.

`mac-mini:operator-checklist` renders the current redacted handoff into a Markdown operator checklist. It lists the first next action, approval-gated steps, hard blockers, expected pre-DNS pending items, and warnings without mutating the host, router, DNS, or secret store. Use `--out /tmp/alatau-mac-mini-checklist.md` for an owner-only handoff file outside the repository, and pass `--prepared-env` when the prepared env file is not at the default `/tmp/alatau-supabase.env.todo`.

`mac-mini:standalone-smoke` builds the standalone output, starts it on `127.0.0.1:5174` with memory backend, runs runtime acceptance, and stops the process. It proves the same `server.js` launchd will run, without installing launchd or touching public traffic. Use `--out /tmp/alatau-standalone-smoke.json` to save the receipt with owner-only permissions.

`mac-mini:install:dry-run` runs the safe preflight chain and prints the install commands for release directories, deploy, and launchd installation. Dry-run continues after failed read-only gates so all blockers remain visible. Real execution requires running `bash ops/mac-mini-install.sh --execute` after explicit approval; execute mode stops before host writes if env audit, readiness, or template validation fails.
`--skip-readiness` is allowed only for dry-run diagnostics; execute mode always requires the readiness gate.

`mac-mini:caddy:dry-run` checks whether Homebrew/Caddy installation can be driven by the repo script. Real Caddy installation requires `bash ops/caddy-install.sh --execute` after explicit approval. If Homebrew is missing, install or choose another approved package manager first.

`mac-mini:caddy-service:dry-run` previews installing `ops/Caddyfile.example` into the Homebrew Caddy config path and restarting the Caddy service. Real service mutation requires exact approval plus `ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute`.

`mac-mini:network-probe` checks the local Mac mini IP, local listeners on `80`, `443`, and `5173`, current public IPv4, current DNS A records, and best-effort public TCP reachability for `80/443`. Public TCP failures are warnings because same-network NAT hairpin checks can be unreliable; confirm router forwarding from an external network before DNS cutover.

`mac-mini:security-audit` checks macOS application firewall state, stealth mode, and remote-login state without changing host settings. Treat firewall disabled or unverifiable as a hard blocker before public cutover; treat remote login enabled as a warning until key-only, intended-user SSH has been confirmed or remote login is disabled.

`mac-mini:security-hardening:dry-run` previews enabling the macOS application firewall and stealth mode. Real mutation requires exact approval plus `ALATAU_SECURITY_HARDENING_CONFIRMED=1 bash ops/mac-mini-security-hardening.sh --execute`. Remote login is left unchanged by default; pass `--disable-remote-login` only after confirming no needed SSH access will be cut off.

`mac-mini:cutover-gate` is the pre-DNS safety gate. It runs `mac-mini:status` and returns `do-not-cutover` while hard blockers remain. In `pre-dns` mode it allows only the two blockers that are expected before the final DNS move: the public A record still points away from the Mac mini and the public runtime still reflects the pre-cutover deployment.

`mac-mini:dns-cutover:dry-run` previews the Porkbun DNS mutation: apex `A` to the Mac mini public IP and `www` `CNAME` to the apex. Real mutation requires exact approval, `ALATAU_DNS_CUTOVER_CONFIRMED=1`, Porkbun credentials from `/Users/azat/.codex/secrets/porkbun.env`, and a green `npm run mac-mini:cutover-gate`. The script never prints API key values.

`mac-mini:handoff` combines `mac-mini:status`, `mac-mini:cutover-gate`, and `mac-mini:plan` into one redacted operator handoff, including hard blockers, expected pending items, warnings, next actions, and approval steps. Use `--out /tmp/alatau-mac-mini-handoff.json` to save it outside the repository with owner-only permissions.

`mac-mini:post-cutover` is dry-run by default and prints the production healthcheck plus live acceptance commands. `--execute` requires exact approval plus `ALATAU_POST_CUTOVER_CONFIRMED=1` because it runs `--post-lead` and creates one smoke lead in the live backend. Use `--out /tmp/alatau-post-cutover.json` to save the redacted result outside the repository.

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
npm run supabase:migrate -- --runtime-env-file /path/to/alatau-supabase.env
npm run supabase:env-install:dry-run -- --source /path/to/filled-alatau-supabase.env
npm run supabase:env-audit -- --file /path/to/alatau-supabase.env
npm run supabase:preflight -- --runtime-env-file /path/to/alatau-supabase.env
```

Run the local production-like server against Supabase:

```bash
PORT=5173 npm run preview:supabase -- --runtime-env-file /path/to/alatau-supabase.env
```

One-command local cutover on port `5173`:

```bash
PORT=5173 npm run supabase:cutover-local -- --runtime-env-file /path/to/alatau-supabase.env
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
DATA_BACKEND=postgres PORT=5173 npm run preview:supabase -- --runtime-env-file /path/to/alatau-supabase.env
```

This requires `SUPABASE_DB_URL` and `ADMIN_EMAILS`; full Supabase REST/Auth mode additionally requires the public URL, anon key, and service role key.

Managed Supabase production migration must be performed only after exact approval, with project ref and backup state confirmed.

The guarded Mac mini env install path is:

```bash
npm run supabase:env-install:dry-run -- --source /path/to/filled-alatau-supabase.env
ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source /path/to/filled-alatau-supabase.env
```

It copies the already-filled env file into `/Users/azat/.codex/secrets/alatau-supabase.env`, sets mode `0600`, and immediately runs the redacted env audit. It does not print env values.

## Deploy

Dry-run:

```bash
bash ops/deploy.sh --dry-run
npm run mac-mini:install:dry-run
npm run security:scan
```

Real Mac mini deploy requires:

1. clean git tree
2. runtime secrets in the host secret store
3. if needed, approved `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source /path/to/filled-alatau-supabase.env`
4. `npm run security:scan` passing across tracked and untracked workspace files
5. `npm run supabase:readiness` passing for the intended env file
6. `npm run supabase:preflight` passing
7. `npm run mac-mini:security-audit` reviewed with no hard blockers
8. if needed, approved `ALATAU_SECURITY_HARDENING_CONFIRMED=1 bash ops/mac-mini-security-hardening.sh --execute`
9. `bash ops/deploy.sh --dry-run` reviewed
10. Caddy installed with `bash ops/caddy-install.sh --execute`
11. Caddyfile installed and Caddy restarted with `ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute`
12. rendered launchd plist installed by `bash ops/mac-mini-install.sh --execute`
13. router forwarding `80/443` to `192.168.8.12`
14. `npm run mac-mini:cutover-gate` returning `ready-for-approved-dns-cutover`
15. explicit approval before changing DNS away from Vercel with `ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute`
16. exact approval for `ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json`, because it writes one smoke lead

The deploy script defaults to macOS-safe paths under `/Users/azat/Services/alatau-service`. Override with `ALATAU_RELEASE_ROOT` and `ALATAU_CURRENT_LINK` only when intentionally deploying elsewhere. Real deploy runs `npm run security:scan`, writes a per-release `release.json`, and mirrors the active release metadata to `/Users/azat/Services/alatau-service/current-release.json`.
Direct real deploy is additionally guarded by `ALATAU_DEPLOY_CONFIRMED=1`; this flag should be set only after the readiness gates above have been reviewed. Real deploy also runs `supabase:env-audit` against `ALATAU_SUPABASE_ENV_FILE` or `/Users/azat/.codex/secrets/alatau-supabase.env` before installing dependencies or building.

Install/service commands are guarded because they mutate host-level configuration. After exact approval, use the install script so the launchd plist is rendered from the same `ALATAU_CURRENT_LINK` and `ALATAU_SUPABASE_ENV_FILE` values used by deploy:

```bash
ALATAU_RELEASE_ROOT=/Users/azat/Services/alatau-service/releases \
ALATAU_CURRENT_LINK=/Users/azat/Services/alatau-service/current \
ALATAU_SUPABASE_ENV_FILE=/Users/azat/.codex/secrets/alatau-supabase.env \
bash ops/mac-mini-install.sh --execute
launchctl print gui/$(id -u)/com.alatau-service.web
```

Caddy should be installed and started with an operator-approved method. The guarded install path is `bash ops/caddy-install.sh --execute`, which expects Homebrew and then validates `ops/Caddyfile.example`. The guarded service path is `ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute`, which copies the Caddyfile into the Homebrew config path, validates it, and restarts the Caddy service. Its config should proxy `alatau-service.com` to `127.0.0.1:5173` and redirect `www.alatau-service.com` to the apex domain.

## Rollback

Dry-run:

```bash
bash ops/rollback.sh --dry-run
```

Rollback only switches the app release symlink and rewrites `current-release.json`. Database migrations require a separate reviewed rollback plan.
Real rollback is guarded by `ALATAU_ROLLBACK_CONFIRMED=1` and should be used only after reviewing the target release directory.

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
