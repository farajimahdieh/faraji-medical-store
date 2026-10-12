---
name: product-content
description: Write product page content (description, specs, FAQs, SEO meta, 1-4 images) for Faraji Medical Store products as content/products/**/*.json files. Use when asked to add, write, fill or improve product descriptions, product photos, FAQs or SEO text for a category or product.
---

# Product content for Faraji Medical Store

You write the copy and pick the images for product pages. The output is JSON
files in `content/products/<category-slug>/`; `content:apply` turns them into
database rows. Read `content/README.md` for the file format and pipeline.

## Workflow (one category at a time)

1. From `apps/api`: `pnpm content:scaffold -- --category=<slug>` -- creates
   skeleton files for products without content. `_holooNames` shows the
   original Holoo line items; delete that key when you finish a file.
2. Work in batches of 5 products. For each product:
   1. Identify the exact product: brand, model/line, material, sizes. Holoo
      names are abbreviated and sometimes misspelled ("طباست" = طباسپت,
      "آترومنag" = Atrauman Ag). If you cannot identify it with confidence,
      leave the file incomplete and list it for the user -- never guess.
   2. Research: the manufacturer's own product page first, then the official
      Iranian distributor/importer, then the product's IFU/catalog PDF.
      Record every page you used in `sources`.
   3. Write the content (rules below).
   4. Pick images (rules below).
3. `pnpm content:apply -- --dry-run` must show no errors for the batch.
4. Commit the batch (`content(<category>): <n> products`), then ask the user
   to run `/codex:review` (or run it yourself if the Codex plugin is
   installed) and fix what it finds before the next batch.
5. Only apply to the database when the user asks:
   `pnpm content:apply -- --path=../../content/products/<slug>`.

## Writing rules

- Persian, warm and plain -- written for a patient or caregiver, not a
  clinician. Short paragraphs. Use the Persian names people actually search
  ("پانسمان زخم بستر", "باند کشی") alongside the technical name
  ("هیدروکلوئید").
- `name`: what a shopper would call it + brand, no sizes (sizes are variants).
  e.g. "پانسمان هیدروکلوئید هارتمن (Hydrocoll)".
- `shortDescription`: 1-2 sentences -- what it is and who it is for.
- `description`: 120-350 words: what it is -> when it is used -> how to use
  it (from the IFU only) -> why buy here (genuine product, in-store advice in
  Tabriz). Paragraphs separated by a blank line.
- `metaTitle` (<= 60 chars): "خرید <name> | فروشگاه فرجی" style, the main
  search phrase first.
- `metaDescription` (120-160 chars): the main search phrase, the key benefit,
  and a reason to click (e.g. "ارسال از تبریز" only if true).
- `features`: 3-6 short, factual bullets.
- `specifications`: only facts found in `sources` (material, size, count per
  pack, sterility, country of manufacture, IRC code if published). Keep the
  scaffolded "سایزهای موجود" row.
- `faqs`: 3-5 real shopper questions (how often to change, can it get wet,
  which wound types, which size to pick). Answers 1-3 sentences.

### Never

- Invent specs, certifications, percentages or clinical claims. If a fact is
  not in `sources`, leave it out.
- Promise a cure or diagnose ("درمان قطعی", "بهترین درمان"). Use "کمک به" /
  "مناسب برای". Add "در صورت عفونت یا عدم بهبود، به پزشک مراجعه کنید" where
  relevant.
- Mention prices, stock, discounts or delivery times -- they change and live
  in Holoo.
- Copy a competitor's text. Rewrite in your own words.

## Image rules

- 1-4 images. First image = the product alone on a plain background.
- Allowed sources, in order: our own photos in `data-private/photos/`
  (`"file"`), the manufacturer's site, the official distributor's site.
- Not allowed: marketplaces and competitors (Digikala, Torob, other
  pharmacies/stores), stock-photo sites, images with another shop's
  watermark or logo, AI-generated product photos.
- Use the largest available version (>= 800px). Give each image a `source`
  page and a descriptive Persian `alt` ("پانسمان هیدروکلوئید هارتمن سایز
  10×10 در بسته‌بندی").

## Products that need a human decision

Flag these to the user instead of publishing as normal:
- Ointments/gels/powders that may be registered as medicines (e.g. پماد
  کامفیل، پماد بیلوا، پماد زیتن) -- online sale of medicines has separate
  rules in Iran.
- Anything you could not identify with confidence.
