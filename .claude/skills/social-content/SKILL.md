---
name: social-content
description: Create Instagram, Telegram and Bale posts (captions, hashtags, carousel slide text, Reels scripts) for Faraji Medical Store products from their approved product content files. Use when asked for social media, Instagram, Reels, carousel, Telegram or Bale content.
---

# Social content for Faraji Medical Store

Source of truth: the product's file in `content/products/` -- it has already
been fact-checked and reviewed. Never add a fact that is not in that file.
If the product has no complete content file yet, write that first (skill
`product-content`).

## Output

One Markdown file per product: `content/social/<category-slug>/<holoo-code>.md`
with these sections:

1. **پست اینستاگرام** -- caption, 80-150 words: a hook line naming the
   problem ("مراقبت از زخم بستر در خانه سخت است؟"), 2-3 short paragraphs,
   a call to action (visit the store in Tabriz / link in bio / ask in DM),
   then 8-15 Persian hashtags mixing broad (#تجهیزات_پزشکی) and specific
   (#پانسمان_زخم_بستر) plus #تبریز.
2. **کاروسل** -- 5-7 slides, max ~15 words each: slide 1 hook, middle slides
   educational tips (from the FAQs), last slide the product + store.
3. **ریلز** -- a 20-40 second script for a phone video shot in the store:
   shot list + on-screen text + voice-over, with the product in hand.
4. **کانال تلگرام / بله** -- 40-80 words with the product page link
   (`/products/<slug>`).

## Rules

- Educational first, sales second -- tips people save and share.
- Same medical-claim limits as product pages: no cures, no diagnoses, refer
  to a doctor for infection or non-healing wounds.
- No prices or discounts in evergreen posts (they change).
- Prefer the store's own photos; manufacturer photos only as allowed in the
  product-content skill.
