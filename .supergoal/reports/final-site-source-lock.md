# Final Site Source Lock

Date: 2026-06-28

Authoritative public UI for this goal:

- `dist/index.html`
- `dist/assets/index-mobilefix3-20260628.css`
- `dist/assets/index-mobilefix3-20260628.js`

Reason:

The user rejected the temporary Next-rendered homepage and identified the latest visual site as the required public result. The root route `/` must therefore load the final `dist` bundle and assets, while Next.js remains the backend/runtime shell for API, CRM, admin, profile, health, and release routes.

Boundary:

Existing dirty `dist/*` files are preserved as source evidence and copied into `public/assets` for runtime serving. They were not reverted.
