# P06 — Final verification and handoff

SUPERGOAL_PHASE_START
Phase: 6 of 6 — Final verification and handoff
Task: Run aggregate checks, visual/runtime smoke, secret scan, and leave a truthful handoff.
Mandatory commands: npm test -- --runInBand && npm run lint && npm run build && npm audit --omit=dev && git diff --check; python3 .supergoal/scripts/sgctl.py validate-package .supergoal
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: P05
RPD required: yes
RPD focus: integration

## Work
- Run tests, lint, build, audit, SuperGoal validators, and diff checks.
- Smoke root, assets, lead API, CRM, admin, profile, health, release.
- Record any live Supabase/public production blockers honestly.

## Acceptance criteria
- Aggregate build/lint/test/audit/diff checks pass or exact blockers are recorded.
- Final handoff states whether live Supabase is actually active and what remains.

## Mandatory commands
- npm test -- --runInBand && npm run lint && npm run build && npm audit --omit=dev && git diff --check
- python3 .supergoal/scripts/sgctl.py validate-package .supergoal

## Evidence required
- direct_artifact evidence for P06-C01
- direct_artifact evidence for P06-C02
