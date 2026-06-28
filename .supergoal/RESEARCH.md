# Research gate record

Status: satisfied
Required: yes
Provider: manual
Query: Plan final Alatau site CRM/admin/profile/Supabase integration from local repo state.

## Trigger
- Research required by contract/risk triggers before roadmap compilation.

## Research tool priority
- Skill `perplex`: preferred
- Official docs / Context7: fallback or verification source
- Generic web search: fallback-only

## Summary
- Manual research established that the latest visual site is the dist bundle, while the current Next homepage is a temporary backend shell. The new plan preserves the dist visual frontend at / and adds backend/CRM/admin/profile/Supabase on the same localhost runtime.

## Fallback justification
- No external web research needed; decisive facts are local current state and explicit user correction.

## Sources
- [manual] Local dist site — dist/index.html
- [manual] Current Next backend shell — app/ and src/
- [manual] User correction — current Codex thread

## Planning implications
- Do not replace the final visual site with temporary Next components.
- Keep localhost:5173 as the immediate verification target.
- Treat live Supabase as required but secret/project access as evidence-gated.

## Unverified assumptions
- none
