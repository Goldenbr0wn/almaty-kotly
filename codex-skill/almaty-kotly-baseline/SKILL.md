---
name: almaty-kotly-baseline
description: Create or maintain a baseline static website for gas boiler repair, maintenance, catalog, comparison, delivery/warranty, and lead-request flows for Almaty. Use when Codex is asked to build, revise, verify, or publish the Almaty gas boiler service site without special design skills or premium redesign work.
---

# Almaty Kotly Baseline

## Overview

Use this skill to produce a practical baseline website for gas boiler service in Almaty. Keep the result simple, inspectable, responsive, and easy to improve later.

## Workflow

1. Build as a static site unless the user explicitly asks for a framework.
2. Include five pages or large sections: home, catalog, product/comparison, delivery and warranty, request form.
3. Ground copy in Almaty: city name, districts, same-day diagnostics, local delivery/service language, and Kazakhstani tenge prices.
4. Keep design intentionally baseline: no special design skills, no premium visual concept, no heavy animation, no external tracking.
5. Use product images or local illustrative placeholders with accurate alt text. Do not invent claims about certifications, stock, warranties, or company identity.
6. Show boiler prices as approximate unless the user provides confirmed inventory and pricing.
7. Verify locally in a browser before claiming the site works.

## Required Content

- Home: service positioning, practical CTAs, service cards, and popular models preview.
- Catalog: 10 boiler models with image, approximate price, power, heating area, type, service note, and CTA.
- Comparison: table or product detail area showing model differences.
- Delivery and warranty: Almaty delivery/service flow, warranty caveats, preparation checklist.
- Request: local form for name, phone, service type, model, district/address, comment; no real submission unless explicitly requested.

For the current baseline model set, read `references/model-set.md`.

## Implementation Defaults

- Use plain HTML, CSS, and JavaScript for first-pass mockups.
- Keep shared data in one JavaScript model array.
- Use responsive CSS with one-column mobile catalog, wrapped navigation, and horizontally scrollable comparison table.
- Prefer local assets or embedded SVG placeholders for reliability in offline/local previews.
- Start a local server with `python3 -m http.server 5173` or another available port, then open the URL in the browser.

## Publishing Guardrails

- Public GitHub repository creation is allowed only when the user explicitly asks for it.
- Do not enable GitHub Pages or deploy to production unless the user explicitly asks.
- Do not commit unrelated workspace changes.
- Do not include secrets, real customer data, analytics keys, or private contact details.
