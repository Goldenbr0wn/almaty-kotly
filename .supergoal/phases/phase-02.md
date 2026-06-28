# P02 — Serve final site on localhost root

SUPERGOAL_PHASE_START
Phase: 2 of 6 — Serve final site on localhost root
Task: Make http://localhost:5173 render the final dist visual site with CSS/images/scripts loading.
Mandatory commands: bash ops/healthcheck.sh --local; npm run build
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: P01
RPD required: yes
RPD focus: ux

## Work
- Sync dist/assets into public/assets for Next serving.
- Replace the temporary Next homepage with a dist-shell page.
- Update preview/standalone preparation so static assets are always copied.

## Acceptance criteria
- Root page contains final-site markers including ALMATY KOTLY/WhatsApp/final hero classes.
- CSS, JS, fonts, and boiler images return HTTP 200 from localhost:5173.

## Mandatory commands
- bash ops/healthcheck.sh --local
- npm run build

## Evidence required
- direct_artifact evidence for P02-C01
- direct_artifact evidence for P02-C02
