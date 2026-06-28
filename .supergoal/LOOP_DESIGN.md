# LOOP_DESIGN.md

## Goal
Make http://localhost:5173 show the latest visual boiler site from dist, with working lead capture, CRM, admin, profile, and Supabase-backed data/auth on the same server; local/prod preview may overwrite the temporary Next UI.

## Context sources
- CONTRACT.json is the canonical source of truth.
- Workspace root: `/Users/azat/Desktop/.github/almaty-kotly`.

## Host model
- Host: standard Hermes `/goal` executor running generated PROTOCOL.md.

## Reviewer / judge model
- Reviewer/judge: embedded RPD/Senior gate with pass/fail mutation requests.

## Verification gates
- Programmatic gate: python3 -m unittest discover -s tests.
- Package gate: python3 scripts/sgctl.py validate-package .supergoal --strict.

## State checkpoints
- STATE.md is generated at compile time and becomes a runtime checkpoint.
- Future v3 STATE.json supersedes STATE.md when present.

## Stop conditions
- Retry at most 3 times per failed gate.
- Stop only for real blockers or after 3 audit rounds.

## Budget
- phases: 6
- max iterations: 8
- audit rounds: 3

## Boundaries
- secrets, credentials, private data, public egress, payment, DNS, and production changes follow profile policy.
- No custom production runner.

## Failure recovery
- On validation failure: patch, retry, or handoff with blocker.
- On state/path drift: recover from disk-bound goal identity.

## Human approvals
- Required only for money, DNS, secrets, grants, destructive production, or public/mass sends.

## ASCII preview
```text
CONTRACT.json -> COMPILE -> /goal -> PHASES -> FINAL AUDIT -> DONE
```
