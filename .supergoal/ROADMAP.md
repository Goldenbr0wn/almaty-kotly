# ROADMAP — Alatau Final Site CRM

## Decision package
- Goal ID: `sg-20260628-alatau-final-site-crm`
- Done condition: localhost:5173 renders the latest dist visual site at /, lead capture writes through the backend, CRM/admin/profile routes are visible and protected where appropriate, Supabase mode is either verified against a configured live project or an exact missing-credentials blocker is recorded, and build/lint/test/smoke evidence passes.
- Research evidence: satisfied via manual — Manual research established that the latest visual site is the dist bundle, while the current Next homepage is a temporary backend shell. The new plan preserves the dist visual frontend at / and adds backend/CRM/admin/profile/Supabase on the same localhost runtime.

## Context summary
- Profile: `production-adjacent-final-site-crm-supabase`
- Contract revision: `2`

## Assumptions
- Markdown is generated from CONTRACT.json.

## Risk top 3
- r1: `wrong frontend regression` — Root route smoke must prove visual site markers from dist, CSS, and hero assets are loaded.
- r2: `lead data exposure` — Server-side validation, no secret output, admin session checks, and secret scan.
- r3: `supabase authority ambiguity` — Health endpoint reports backend mode; final audit must prove Supabase mode or record exact missing-credential blocker.

## Phase map
- P01: Baseline and final visual source lock — depends on none
- P02: Serve final site on localhost root — depends on P01
- P03: Lead capture bridge — depends on P02
- P04: CRM admin and profile — depends on P03
- P05: Supabase authority — depends on P04
- P06: Final verification and handoff — depends on P05

## Phases

### P01 — Baseline and final visual source lock
Task: Lock the latest dist site as the public UI source and record why the temporary Next UI is wrong.
Acceptance criteria:
- P01-C01: Final dist bundle is named as the public homepage authority.
- P01-C02: Existing dirty dist files are preserved rather than reverted.
Mandatory commands:
- P01-CMD01: `git status --short --branch`
- P01-CMD02: `sed -n '1,80p' dist/index.html`
Evidence: direct_artifact

### P02 — Serve final site on localhost root
Task: Make http://localhost:5173 render the final dist visual site with CSS/images/scripts loading.
Acceptance criteria:
- P02-C01: Root page contains final-site markers including ALMATY KOTLY/WhatsApp/final hero classes.
- P02-C02: CSS, JS, fonts, and boiler images return HTTP 200 from localhost:5173.
Mandatory commands:
- P02-CMD01: `bash ops/healthcheck.sh --local`
- P02-CMD02: `npm run build`
Evidence: direct_artifact

### P03 — Lead capture bridge
Task: Wire the final site's request form to /api/leads without changing the visual bundle.
Acceptance criteria:
- P03-C01: Submitting final-site request form creates one lead through /api/leads.
- P03-C02: Invalid submissions fail safely and reveal no secrets.
Mandatory commands:
- P03-CMD01: `npm test -- --runInBand`
Evidence: direct_artifact

### P04 — CRM admin and profile
Task: Expose CRM, admin Kanban, and profile routes on the same server with consistent protected data boundaries.
Acceptance criteria:
- P04-C01: /crm, /admin/leads, and /profile render on localhost:5173.
- P04-C02: Protected routes use server-derived admin/session state and no raw provider payloads.
Mandatory commands:
- P04-CMD01: `npm run lint`
Evidence: direct_artifact

### P05 — Supabase authority
Task: Make Supabase mode explicit, testable, and ready for live credentials; prove live mode if credentials exist or record exact blocker.
Acceptance criteria:
- P05-C01: Health endpoint reports backend data authority accurately without secrets.
- P05-C02: Live Supabase is verified or missing credential/project details are recorded as an exact blocker.
Mandatory commands:
- P05-CMD01: `curl -fsS http://127.0.0.1:5173/api/health`
- P05-CMD02: `npm run build`
Evidence: direct_artifact

### P06 — Final verification and handoff
Task: Run aggregate checks, visual/runtime smoke, secret scan, and leave a truthful handoff.
Acceptance criteria:
- P06-C01: Aggregate build/lint/test/audit/diff checks pass or exact blockers are recorded.
- P06-C02: Final handoff states whether live Supabase is actually active and what remains.
Mandatory commands:
- P06-CMD01: `npm test -- --runInBand && npm run lint && npm run build && npm audit --omit=dev && git diff --check`
- P06-CMD02: `python3 .supergoal/scripts/sgctl.py validate-package .supergoal`
Evidence: direct_artifact
