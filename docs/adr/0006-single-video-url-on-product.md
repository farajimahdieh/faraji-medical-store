# ADR-0006: Single `videoUrl` Column on Product, Not a `ProductVideo` Table

## Status
Accepted

## Context
Product imports can carry a product-specific instructional video (e.g. an
embedded YouTube/Aparat player on the source site). We need somewhere to
store that link.

## Decision
Store it as `videoUrl` (+ `videoSource`) directly on `Product`, not as a
separate `ProductVideo` table.

## Alternatives Considered
- A `ProductVideo` entity (`id`, `productId`, `url`, `title`, `source`,
  `sortOrder`), anticipating products with multiple videos.

## Why This Decision
Every source integrated so far (teb-sanat.com) has at most one
instructional video per product — checked directly against the live site
before deciding, not assumed. A one-to-many table for a relationship that
is, in practice, one-to-zero-or-one is exactly the kind of speculative
generality this project avoids elsewhere (see ADR-0004). Two plain nullable
columns are trivial to migrate away from later if a source ever needs more
than one video.

## Consequences
- Simpler queries and DTOs: no join needed to know if a product has a video.
- If a future source provides multiple videos per product, that's the
  trigger to extract a `ProductVideo` table — a mechanical migration, not
  a redesign.
