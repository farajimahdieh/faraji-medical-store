# Faraji Medical Store -- agent guide

Read by Codex directly and by Claude Code through `CLAUDE.md`. Both agents
follow the same rules; when one writes and the other reviews, the reviewer
uses the checklists below.

## Project

Online store for a real medical-equipment shop in Tabriz, Iran.
pnpm monorepo:

- `apps/api` -- NestJS + TypeORM + PostgreSQL. All business rules, prices,
  stock, payments.
- `apps/web` -- Next.js storefront and admin panel (rendering only). Read
  `apps/web/AGENTS.md` before touching it: this Next.js version differs from
  older training data.
- `content/` -- product copy as JSON, applied with `pnpm content:apply`
  (see `content/README.md`).
- `docs/adr/` -- architecture decisions; follow them or write a new ADR.

## Commands

From `apps/api`: `pnpm test`, `pnpm lint`, `npx tsc --noEmit`,
`pnpm test:e2e` (needs a database), `pnpm migration:generate`.
From `apps/web`: `pnpm test`, `pnpm lint`, `npx next typegen && npx tsc --noEmit`.
Use the pnpm version pinned in `apps/web/package.json` (11.x) so the
lockfile does not churn.

## Hard rules

- The repository is **public**. Never commit `.env` files, API keys, Arvan
  credentials, Holoo exports, purchase prices or customer data.
  `data-private/` is git-ignored for this reason.
- Prices/stock/codes come from Holoo (accounting) only. Prices are stored
  in Toman; Holoo exports are in Rial.
- Never invent business facts (address, phone, licenses) or product facts
  (specs, certifications, clinical claims).
- Schema changes go through a TypeORM migration; never `synchronize: true`.
- Nothing publishes a product unless the owner asks: new/edited products
  wait for admin approval (`needs_review`). When the owner asks to put a
  category live, `content:apply --publish` publishes complete products,
  never files marked `"hold": true` (possible medicines).

## Review checklist -- code

1. Security: auth/role guards on every admin route, input validated by DTOs,
   no secrets or private data in the diff, no new `dangerouslySetInnerHTML`
   without escaping, file uploads validated.
2. Money: amounts are integers in Toman, never rounded for display, no
   client-side price trust.
3. Tests: new logic has unit tests; existing tests and lint pass.
4. Migrations: reversible, and only the intended changes.
5. Dependencies: new packages are justified, maintained, and free of known
   advisories (`pnpm audit --prod`).

## Review checklist -- product content (`content/products/**`)

For every changed file, check against its `sources`. Facts from the store
owner (`content/owner-facts.md`, cited as `owner: ...`) are authoritative --
do not remove them as undocumented.

1. Identity: name, brand and sizes match the Holoo item (`_holooNames` in
   the skeleton / variant names) and the source pages.
2. Facts: every spec, feature and FAQ answer is supported by a listed
   source. Flag anything that is not.
3. Tone and medical safety: warm, confident and guiding -- no distancing
   phrases like "به گفته‌ی سازنده"; but no cure/guaranteed-result claims,
   no "best treatment", no boilerplate "see a doctor" lines;
   ointments/gels that may be medicines are flagged for the owner.
4. SEO: `metaTitle` <= 60 chars with the main search phrase first,
   `metaDescription` 120-160 chars, description 70-150 words in natural
   Persian (no keyword stuffing), 3-5 useful FAQs.
5. Images: 1-4 sharp photos of the exact product, first one showing the
   product alone, descriptive Persian `alt`. Any website is an allowed
   source (owner's decision); another shop's watermark/logo/price must be
   removed without altering the product itself. Never a different model
   or an AI-generated product. Generic unbranded items may use a clean
   photo of the same item type.
7. Possible medicines (ointments, medicated gels/powders) carry
   `"hold": true`.
6. No prices, stock levels or delivery promises in the text, and no box or
   pack counts -- the store sells single pieces (unless the Holoo item name
   itself is a pack).
