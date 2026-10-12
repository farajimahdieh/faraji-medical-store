# Content

Text and image references for the storefront, kept in git so every change is
a reviewable diff. Nothing here is secret: **never put purchase prices,
supplier terms or API keys in this folder** (the repository is public).
Private inputs (Holoo exports, our own photos) go in `data-private/`, which
git ignores.

```
content/
  products/<category-slug>/<holoo-code>.json   product page copy -> pnpm content:apply
  social/<category-slug>/<holoo-code>.md       Instagram/Telegram/Bale posts (not applied anywhere)
```

## Pipeline

1. `pnpm import:holoo -- --file=../../data-private/<file>.xlsx --category=<slug>`
   creates products + variants (price/stock/code) from Holoo.
2. `pnpm content:scaffold -- --category=<slug>` writes an empty JSON per
   product that has no content file yet.
3. Claude Code fills them using the `product-content` skill.
4. `pnpm content:apply -- --dry-run` validates; Codex reviews the diff using
   the checklist in `AGENTS.md`.
5. `pnpm content:apply -- --path=../../content/products/<slug>` writes the
   text and uploads images (Arvan when `STORAGE_DRIVER=arvan`). Products
   move to "needs review"; an admin approves them in `/admin/products/pending`.

All `pnpm` commands run from `apps/api`.

## Product file format

```json
{
  "slug": "<product slug -- do not change>",
  "name": "<display name>",
  "brand": "<manufacturer brand>",
  "shortDescription": "<1-2 sentences>",
  "description": "<70-150 words, paragraphs separated by a blank line>",
  "metaTitle": "<= 60 chars, max 70",
  "metaDescription": "<120-160 chars, max 170>",
  "features": ["..."],
  "specifications": [{ "name": "...", "value": "..." }],
  "faqs": [{ "question": "...", "answer": "..." }],
  "images": [
    { "url": "https://manufacturer.example/img.jpg", "alt": "...", "source": "https://manufacturer.example/product-page" },
    { "file": "data-private/photos/113150018-1.jpg", "alt": "..." }
  ],
  "sources": ["https://manufacturer.example/product-page"]
}
```
