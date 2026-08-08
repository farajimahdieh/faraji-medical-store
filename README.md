# Faraji Medical Store

Online store for a physical medical equipment shop in Iran. This is both a real
production system being built for an actual business and a full-stack
engineering project documenting its own architecture decisions from day one.

**Status:** Early development (Phase 0 — project bootstrap, no application
code yet).

## Project Overview

A retail e-commerce platform connecting an existing physical medical
equipment store to online customers: browsing, account-based purchasing,
online payment, order tracking, and an admin panel for managing products,
inventory, and orders.

## Business Context

- Retail sales of medical equipment, with architecture that allows adding
  wholesale accounts later
- Purchase requires a user account
- Trust and legitimacy (real store, real contact info, real address) is a
  core product requirement — no fabricated business information is ever
  used in this codebase
- Future integration with the store's accounting software (API not yet
  available)
- Physical store and online store inventory must eventually share a single
  source of truth

## Architecture

- **Style:** Modular monolith (NestJS backend), not microservices — see
  `docs/adr/` for the reasoning
- **Frontend/Backend boundary:** Next.js handles rendering and UX only;
  all business rules, pricing, inventory checks, and payment verification
  live in the NestJS backend
- Full architecture decisions are recorded in [`docs/adr/`](docs/adr/)

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Frontend | Next.js (React) |
| Backend | NestJS (Express adapter) |
| Database | PostgreSQL |
| ORM | TypeORM |
| API style | REST |
| Package manager | pnpm (workspaces) |

## Repository Structure

```
apps/web/           Next.js frontend
apps/api/           NestJS backend
packages/           Shared packages (e.g. shared TypeScript types)
docs/architecture/  Architecture overviews
docs/adr/           Architecture Decision Records
docs/api/           API documentation
docs/development/   Local development guides
```

## Local Development

_Not available yet — application scaffolding starts in Phase 1._

## License

All rights reserved. This is a proprietary commercial project; the source
is public for portfolio purposes only and is not licensed for reuse.
