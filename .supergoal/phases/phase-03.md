# P03 — Lead capture bridge

SUPERGOAL_PHASE_START
Phase: 3 of 6 — Lead capture bridge
Task: Wire the final site's request form to /api/leads without changing the visual bundle.
Mandatory commands: npm test -- --runInBand
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: P02
RPD required: yes
RPD focus: security

## Work
- Add a capture script that posts final form fields to the backend API.
- Show success/error in the existing final-site request note.
- Keep validation and honeypot protections server-side.

## Acceptance criteria
- Submitting final-site request form creates one lead through /api/leads.
- Invalid submissions fail safely and reveal no secrets.

## Mandatory commands
- npm test -- --runInBand

## Evidence required
- direct_artifact evidence for P03-C01
- direct_artifact evidence for P03-C02
