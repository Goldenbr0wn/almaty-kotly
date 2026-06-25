# Almaty Kotly Baseline

Baseline static website for gas boiler repair, maintenance, catalog, comparison, delivery/warranty, and request flows in Almaty.

## Pages

- `index.html` - home page and service positioning
- `catalog.html` - 10 boiler model cards
- `compare.html` - model comparison table
- `delivery-warranty.html` - delivery, diagnostics, and warranty information
- `request.html` - local request form mockup

## Run Locally

```bash
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173/index.html
```

## Notes

- Prices are approximate and should be confirmed before production use.
- The request form is a local mockup and does not send data.
- Product images are stored locally in `assets/boilers/` and normalized into one storefront card system.
- Image sources are listed in `assets/boilers/SOURCES.md`.
- Imagegen frontend section targets are stored in `design-targets/`.
- The included Codex skill lives in `codex-skill/almaty-kotly-baseline`.
- The visual system is adapted from `design-system/deck-card-presentation.DESIGN.md`.
