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
   1. Identify the product: brand, model/line, material, sizes. Holoo
      names are abbreviated and sometimes misspelled ("طباست" = طباسپت,
      "آترومنag" = Atrauman Ag). If the exact model is unclear, still write
      the page at brand + type level (see Image rules) -- never invent
      model-specific specs, and list the product in the report so the
      owner can send a pack photo later.
   2. Research: the manufacturer's own product page first, then the official
      Iranian distributor/importer, then the product's IFU/catalog PDF.
      Record every page you used in `sources`.
      **The store owner is a valid source.** Facts the owner states about a
      product they stock (brand, maker, size, country, ingredient) are
      recorded in `content/owner-facts.md` and cited in `sources` as
      `"owner: content/owner-facts.md"`. Use them; never remove them as
      "undocumented".
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
- Selling unit: the store sells **single pieces** -- customers buy as many
  as they want, not whole boxes. The price is per piece. Never mention box
  or pack counts ("۵ عدد در جعبه", "تعداد در جعبه", "هر جعبه چند عدد
  دارد؟") in the text, specs or FAQs. Exception: when the Holoo name itself
  names a pack (e.g. "چسب زخم ترکیه 10عددی"), that pack is the unit sold --
  describe it as such.
- Sizes: when a product has several sizes, name them in the description
  and help pick one ("سایز را کمی بزرگ‌تر از خود زخم انتخاب کنید"). The
  page already shows a size selector with each size's own price. For
  body-worn supports (belts, corsets, collars, knee/wrist/ankle/elbow
  braces, stockings, any brand incl. Paksman), the page also shows the
  Teb-o-Sanat size table under the photos (`apps/web/src/data/size-guide.ts`;
  there is no separate size-guide page). Point the reader there instead of "ask us for the
  size": e.g. "برای انتخاب سایز، اندازه‌ی دور کمر را بگیرید و با جدول
  «راهنمای انتخاب سایز» زیر عکس محصول مقایسه کنید." Do not copy size
  numbers into the text.
- Colours: when the owner says an item comes in more colours than the
  photos show (pillows, cushions), say so and invite the reader to ask for
  their colour. Use the Persian names people actually search
  ("پانسمان زخم بستر", "باند کشی") alongside the technical name
  ("هیدروکلوئید").
- `name`: what a shopper would call it + brand, no sizes (sizes are variants).
  e.g. "پانسمان هیدروکلوئید هارتمن (Hydrocoll)".
- `shortDescription`: 1-2 sentences -- what it is and who it is for.
- `description`: short and simple, 70-150 words: what it is -> what it is
  used for and in which situations -> how to use it in a sentence or two
  (from the IFU only). End with one friendly line inviting questions, e.g.
  "اگر سؤالی داشتید، از ما بپرسید؛ با کمال میل راهنمایی‌تان می‌کنیم."
  No filler. Paragraphs separated by a blank line.
- Goal of every text: the reader feels "this is a good product, this shop
  knows what it sells, I can trust them". Achieve it by being complete and
  clear, not by hype: answer what a first-time buyer would ask, in plain
  words anyone can follow with no medical background. Trust points may
  only use real facts already on the site (e.g. the physical store in
  Tabriz, in-store advice) -- never invent years, awards or guarantees.
- Complementary products: when the product is normally used together with
  other items, say so and name the ones we sell, in the order of use, e.g.
  "اول زخم را با سرم شست‌وشو یا اسپری طباسپت تمیز کنید، بعد این پانسمان
  را بگذارید و برای ثابت نگه داشتن، روی آن چسب حصیری بزنید." Only name
  products that exist in Holoo/`content/products` (check before naming);
  for anything we don't stock, use the generic name.
- `metaTitle` (<= 60 chars): "خرید <name> | فروشگاه فرجی" style, the main
  search phrase first.
- `metaDescription` (120-160 chars): the main search phrase, the key benefit,
  and a reason to click (e.g. "ارسال از تبریز" only if true).
- `features`: 3-6 short, factual bullets.
- `specifications`: only facts found in `sources` (material, size,
  sterility, brand country, country of manufacture, IRC code if
  published). Plain labels -- no "(طبق سایت سازنده)" or similar. Keep the
  scaffolded "سایزهای موجود" row.
- `faqs`: 3-5 real shopper questions (how often to change, can it get wet,
  which wound types, which size to pick). Answers 1-3 sentences.

### Never

- Invent specs, certifications, percentages or clinical claims. If a fact is
  not in `sources`, leave it out.
- Promise a cure or a guaranteed result ("درمان قطعی", "صددرصد خوب
  می‌شود", "بهترین درمان"). Reassure with what the product reliably does
  ("محیط زخم را مرطوب و تمیز نگه می‌دارد و به ترمیم کمک می‌کند").
- Add "see a doctor/nurse" lines to every product -- it is obvious and
  makes the text long. Keep such advice only where it is genuinely
  product-specific, at most once, preferably in an FAQ.
- Mention prices, stock, discounts or delivery times -- they change and live
  in Holoo.
- Copy a competitor's text. Rewrite in your own words.

## Image rules

- 1-4 images. First image = the product alone on a plain background.
- Generic, unbranded items (sterile gauze, plain bandage, tape, film roll):
  a clean photo of the same item type is acceptable when no photo of the
  exact pack exists, as long as it shows no brand, logo or watermark that
  differs from ours. Give it an honest `alt` (e.g. "گاز استریل ۱۰×۱۰").
- Every product should get images -- search in both Persian and English
  (brand + model + size, e.g. "Hydrocoll Hartmann", "پانسمان هیدروکل
  هارتمن").
- Every product gets 1-4 sharp images (>= 800px). Owner's decision: images
  may come from **any website**, including other shops -- these are the
  same branded products every store sells. Prefer, in order: our own
  photos, the manufacturer, the official distributor, then any other site.
- The image must show the exact product (same brand, model, size where
  visible) when the model is known. Never: a collage of unrelated items,
  or an AI-generated/redrawn product.
- **Never leave a product without images just because the exact model is
  uncertain** (owner's decision). When the brand and product type are
  known (e.g. "پروتز سینه آمونا", "جوراب واریس واریمد", "واکر GTS"), use a
  clean photo of that brand's closest product of the same type -- prefer
  its basic/best-selling model. Write the text at the brand + type level:
  what it is, what it is for, how to choose a size; leave out
  model-specific specs. Mark the image honestly in `alt` ("نمونه‌ی پروتز
  سینه آمونا"). Only when not even the brand is identifiable, use a clean
  photo of the same item type (see generic items below).
- Another shop's watermark, logo, price tag or frame may be removed (crop
  it out, or clean the background area) -- but never alter the product or
  its own branding/packaging. Save the cleaned file in
  `data-private/photos/<holoo-code>-<n>.jpg` and reference it with
  `"file"`; put the original page in `source`.
- If a site blocks downloading, save the image into `data-private/photos/`
  the same way.
- Owner's shop photos are never used raw. Clean each one first: remove the
  background (Python `rembg` with the `isnet-general-use` model works well;
  for white or transparent packs, where it fails, crop tightly to the pack
  instead), auto-correct light/contrast, sharpen lightly, and centre on a
  white 1000×1000 canvas. Rotate so the pack's text reads upright. Drop
  shots that show other products, handwriting or price tags. Look at the
  result before using it.
- Use the largest available version (>= 800px). Give each image a `source`
  page and a descriptive Persian `alt` ("پانسمان هیدروکلوئید هارتمن سایز
  10×10 در بسته‌بندی").

## Publishing

The owner may ask to put a whole category live. Then run
`pnpm content:apply -- --path=../../content/products/<slug> --publish`:
complete products (description + image) go live directly. Files with
`"hold": true` are never published by this -- set it on every product
that may be a medicine (see below).

## Products that need a human decision

Flag these to the user instead of publishing as normal:
- Ointments/gels/powders that may be registered as medicines (e.g. پماد
  کامفیل، پماد بیلوا، پماد زیتن): write their content and images as usual,
  add `"hold": true` to the file, and list them in the report as "do not
  approve yet" -- online sale of medicines has separate rules in Iran, so
  the owner decides when to publish them.
- Anything you could not identify with confidence.
