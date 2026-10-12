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

- Persian, warm, friendly and honest -- like a knowledgeable shop assistant
  talking to a worried patient or caregiver, not a clinician. Short
  sentences, short paragraphs. Reassuring and guiding: explain what the
  product does, who it is for, and how to use it step by step.
- Speak with confidence. We stand behind what we sell, so state facts
  directly ("این پانسمان تا ۷ روز روی زخم می‌ماند") -- never distance
  ourselves with "به گفته‌ی سازنده", "طبق ادعای سازنده", "سازنده می‌گوید"
  or similar. Confidence comes from the facts, not from exaggeration.
- Brand origin: say where the brand comes from and where the product is
  made when the sources state it, e.g. "برند بیورر آلمانی است و این مدل
  در چین تولید می‌شود". If one of the two is unknown, say only the known
  one.
- Sizes: when a product has several sizes, name them in the description
  and help pick one ("سایز را کمی بزرگ‌تر از خود زخم انتخاب کنید"). The
  page already shows a size selector with each size's own price. Use the Persian names people actually search
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
- Promise a cure or a guaranteed result ("درمان قطعی", "صددرصد خوب
  می‌شود", "بهترین درمان"). Reassure with what the product reliably does
  ("محیط زخم را مرطوب و تمیز نگه می‌دارد و به ترمیم کمک می‌کند"). Add a
  short, kind line to see a doctor if the wound looks infected or does not
  improve.
- Mention prices, stock, discounts or delivery times -- they change and live
  in Holoo.
- Copy a competitor's text. Rewrite in your own words.

## Image rules

- 1-4 images. First image = the product alone on a plain background.
- Every product should get images -- search in both Persian and English
  (brand + model + size, e.g. "Hydrocoll Hartmann", "پانسمان هیدروکل
  هارتمن").
- Sources, in order of preference: our own photos in `data-private/photos/`
  (`"file"`), the manufacturer's site, the official distributor/importer,
  the brand's catalogs and social pages, then other websites -- but only
  the clean official product photo (packshot) of the exact same product.
- Never use: photos carrying another shop's watermark, logo or price tag,
  photos of a different model/size, collages, stock photos, AI-generated
  images. If a site blocks downloading, save the image into
  `data-private/photos/` and reference it with `"file"`.
- Use the largest available version (>= 800px). Give each image a `source`
  page and a descriptive Persian `alt` ("پانسمان هیدروکلوئید هارتمن سایز
  10×10 در بسته‌بندی").

## Products that need a human decision

Flag these to the user instead of publishing as normal:
- Ointments/gels/powders that may be registered as medicines (e.g. پماد
  کامفیل، پماد بیلوا، پماد زیتن): write their content and images as usual,
  but list them in the report as "do not approve yet" -- online sale of
  medicines has separate rules in Iran, so the owner decides when to
  publish them.
- Anything you could not identify with confidence.
