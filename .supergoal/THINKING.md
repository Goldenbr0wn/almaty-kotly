# THINKING — Alatau Final Site CRM

## Goal
Make http://localhost:5173 show the latest visual boiler site from dist, with working lead capture, CRM, admin, profile, and Supabase-backed data/auth on the same server; local/prod preview may overwrite the temporary Next UI.

## Non-goals
- Do not preserve the temporary plain Next frontend as the public homepage.
- Do not mutate DNS, router, or public alatau-service.com traffic in this goal unless separately requested again.
- Do not print or commit real Supabase service keys, tokens, cookies, or env values.
- Do not edit AGENTS.md or protected agent config.

## Constraints and permissions
- Profile: `production-adjacent-final-site-crm-supabase`
- Workspace root: `/Users/azat/Desktop/.github/almaty-kotly`
- Executor: standard Hermes `/goal`; no production runner.

## Risks top 3
- r1: wrong frontend regression — Root route smoke must prove visual site markers from dist, CSS, and hero assets are loaded.
- r2: lead data exposure — Server-side validation, no secret output, admin session checks, and secret scan.
- r3: supabase authority ambiguity — Health endpoint reports backend mode; final audit must prove Supabase mode or record exact missing-credential blocker.

## Dependencies/order
- Phase order is derived from `CONTRACT.json` phase ordinals and dependencies.

## Assumptions
- Contract source is canonical; Markdown files are generated views.

## Memory hits applied
- none

## Tools/skills used
- chip-supergoal compiler

## Best practices applied
- deterministic rendering
- semantic validation
