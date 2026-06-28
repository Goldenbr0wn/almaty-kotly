# P01 — Baseline and final visual source lock

SUPERGOAL_PHASE_START
Phase: 1 of 6 — Baseline and final visual source lock
Task: Lock the latest dist site as the public UI source and record why the temporary Next UI is wrong.
Mandatory commands: git status --short --branch; sed -n '1,80p' dist/index.html
Acceptance criteria: 2
Evidence required: direct_artifact
Depends on phases: none
RPD required: yes
RPD focus: ux

## Work
- Capture repo status and dist asset names.
- Record root route must show final dist markers, not temporary Next copy.

## Acceptance criteria
- Final dist bundle is named as the public homepage authority.
- Existing dirty dist files are preserved rather than reverted.

## Mandatory commands
- git status --short --branch
- sed -n '1,80p' dist/index.html

## Evidence required
- direct_artifact evidence for P01-C01
- direct_artifact evidence for P01-C02
