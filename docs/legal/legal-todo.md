# Legal TODO

This closes the Lesson 3 requirement to add legal pages or a legal TODO. It is an operator checklist, not legal advice.

## Source Skill

- `chip-legal-web-rf`

## Public Routes To Add Before Production

- `/legal/offer`
- `/legal/privacy`
- `/legal/personal-data-consent`
- `/legal/ads-consent`
- `/legal/cookies`
- `/legal/rules`

## Checkbox Matrix

| Screen | Checkbox | Required | Default | Linked document | Evidence to store |
| --- | --- | --- | --- | --- | --- |
| Request form | I agree to personal-data processing | yes | unchecked | `/legal/personal-data-consent` | timestamp, form source, document version |
| Request form | I agree to the privacy policy | yes | unchecked | `/legal/privacy` | timestamp, form source, document version |
| Newsletter or promo opt-in | I agree to receive advertising messages | no | unchecked | `/legal/ads-consent` | timestamp, channel, document version |
| Cookie banner | I agree to analytics cookies | no | unchecked | `/legal/cookies` | timestamp, browser consent state |

## Blockers Before Public Cutover

- Replace placeholders with the real operator entity data after legal review.
- Confirm whether requests are only service leads or paid online sales.
- Confirm whether advertising/newsletter sends are enabled.
- Confirm whether analytics or tracking cookies are active.
- Add final route pages or keep this TODO linked from the operator handoff until pages exist.
