# ADR-0004: Pricing Stays Inside Catalog for v1

## Status
Accepted

## Context
Retail pricing in v1 is simple: each product has one price. Wholesale
pricing, tiered/quantity-based pricing, and discount rules are planned for
a later phase but are not needed now.

## Decision
Do not create a separate `Pricing` module yet. Price lives as a plain
attribute on the product, owned by the `Catalog` module.

## Alternatives Considered
- **Separate `Pricing` module from day one**, anticipating wholesale/tiered
  pricing and discount logic.

## Why This Decision
Splitting pricing into its own module now would be designing for a
requirement that doesn't exist yet (over-engineering) — there is no
current logic complex enough to justify the extra indirection of a
separate module, service, and API surface. When wholesale pricing, tiered
pricing, or discount rules are actually implemented, that's the right time
to decide whether pricing logic has grown complex/distinct enough to
deserve its own module — a decision better made against real requirements
than speculative ones.

## Consequences
- Keeps the product domain simple while pricing logic is simple.
- When wholesale/tiered pricing is implemented, extracting pricing into
  its own module is a refactor to revisit, not a blocker — this ADR
  documents that the decision was deliberate and time-bound, not an
  oversight.
