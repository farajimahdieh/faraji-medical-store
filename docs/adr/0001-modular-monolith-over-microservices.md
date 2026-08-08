# ADR-0001: Modular Monolith Over Microservices

## Status
Accepted

## Context
The backend needs clear boundaries between domains (catalog, inventory,
orders, payments, shipping, accounting integration, ...) so the codebase
stays maintainable as it grows. The team is a single developer building
both a real production system and a learning project.

## Decision
Build the backend as a single NestJS application, organized into
domain-oriented modules with explicit boundaries (module-owned services,
no direct cross-module database access). Do not split into separate
deployable services.

## Alternatives Considered
- **Microservices from day one**: separate deployable services per domain
  (auth-service, order-service, ...), communicating over the network.

## Why This Decision
Microservices solve problems this project doesn't have yet: independent
scaling of specific domains, independent deploys by separate teams, and
fault isolation across services. For a single developer and moderate
traffic, they only add cost: multiple deployments, network calls where a
function call would do, distributed transactions for things that need to
be atomic (e.g. decrementing stock on order creation), and much higher
operational complexity. A modular monolith gets the maintainability
benefit (clear domain boundaries) without that cost, and keeps the door
open to extracting a module into its own service later if a real need
appears.

## Consequences
- All domain modules deploy together, as one process.
- Module boundaries must be enforced by convention/code review (NestJS
  doesn't hard-block cross-module database access on its own) — services
  are exposed as the way other modules interact with a domain, not its
  repository directly.
- If a specific domain later needs independent scaling (most likely
  candidate: inventory/order processing under high load), it can be
  extracted because the boundary already exists at the module level.
