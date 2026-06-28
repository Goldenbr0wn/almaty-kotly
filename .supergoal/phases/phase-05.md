# P05 — Supabase authority

SUPERGOAL_PHASE_START
Phase: 5 of 6 — Supabase authority
Task: Make Supabase mode explicit, testable, and ready for live credentials; prove live mode if credentials exist or record exact blocker.
Mandatory commands: curl -fsS http://127.0.0.1:5173/api/health; npm run build
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: P04
RPD required: yes
RPD focus: security

## Work
- Keep .env.example placeholder-only and document required Supabase keys.
- Ensure /api/health reports memory vs supabase mode without secrets.
- Run Supabase smoke if credentials are configured through safe runtime env.

## Acceptance criteria
- Health endpoint reports backend data authority accurately without secrets.
- Live Supabase is verified or missing credential/project details are recorded as an exact blocker.

## Mandatory commands
- curl -fsS http://127.0.0.1:5173/api/health
- npm run build

## Evidence required
- direct_artifact evidence for P05-C01
- direct_artifact evidence for P05-C02
