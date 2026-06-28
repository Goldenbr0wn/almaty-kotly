# P04 — CRM admin and profile

SUPERGOAL_PHASE_START
Phase: 4 of 6 — CRM admin and profile
Task: Expose CRM, admin Kanban, and profile routes on the same server with consistent protected data boundaries.
Mandatory commands: npm run lint
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: P03
RPD required: yes
RPD focus: security

## Work
- Add /crm as the lead operations dashboard.
- Keep /admin/leads protected and useful for status changes.
- Add /profile showing current admin/account state and Supabase mode.

## Acceptance criteria
- /crm, /admin/leads, and /profile render on localhost:5173.
- Protected routes use server-derived admin/session state and no raw provider payloads.

## Mandatory commands
- npm run lint

## Evidence required
- direct_artifact evidence for P04-C01
- direct_artifact evidence for P04-C02
