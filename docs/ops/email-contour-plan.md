# Email Contour Plan

This closes the Lesson 3 requirement to connect or plan the email contour without sending mail or storing secrets in the repository.

## Decision

- Provider: Resend or an equivalent transactional email service.
- Scope: lead confirmation, manager notification, admin invite/login email, and future status updates.
- Secret handling: secrets are runtime-injected from the local secret store or deployment environment, never committed.
- Current state: planned, not publicly sending until the domain and runtime cutover are approved.

## Required Runtime Keys

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `RESEND_API_KEY`

## Flow

- Request form creates a lead in the backend.
- Backend sends an operator notification after lead persistence.
- User receives a short confirmation only after delivery domain and consent copy are approved.
- Failed sends are logged as redacted status records, not as raw provider payloads.

## Verification Before Enabling

- Domain sender is verified in the provider dashboard.
- SPF, DKIM, and DMARC records are present.
- `/request` consent copy links to the legal TODO or final legal pages.
- A dry-run command proves template rendering without sending external messages.
- A production smoke uses a test recipient only after explicit approval.
