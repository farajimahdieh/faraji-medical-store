# ADR-0002: Monorepo With pnpm Workspaces

## Status
Accepted

## Context
The project has two deployable applications (Next.js frontend, NestJS
backend) that benefit from sharing TypeScript types (e.g. DTOs) and being
developed together by a single developer.

## Decision
Use a single Git repository containing `apps/web`, `apps/api`, and
`packages/*`, managed with pnpm workspaces.

## Alternatives Considered
- **Two separate repositories** (frontend repo + backend repo).
- **npm or yarn workspaces** instead of pnpm.
- **Nx or Turborepo** on top of a workspace for build orchestration/caching.

## Why This Decision
Two repos would force cross-cutting changes (e.g. a shared type used by
both apps) into two separate PRs and add repo-coordination overhead with
no real benefit for a solo developer. A monorepo keeps related changes
together and gives a single, coherent view of the system — useful both
for development and for presenting the project as a portfolio piece.

pnpm was chosen over npm/yarn workspaces because it stores dependencies in
a single global content-addressable store (faster installs, less disk
usage across projects) and enforces strict `node_modules` resolution,
which prevents "phantom dependencies" (importing a package that happens to
be present in `node_modules` without being declared in `package.json`) —
a class of bug npm's flat `node_modules` allows silently.

Nx/Turborepo were set aside for now: with only two apps, the build
orchestration and caching they provide isn't yet solving a real problem.
Plain pnpm workspaces are enough; this can be revisited if build times or
task coordination become painful.

## Consequences
- A single `pnpm install` at the repo root installs dependencies for both
  apps.
- Internal packages (e.g. a future `packages/shared-types`) are consumed
  like normal npm packages via workspace linking, without publishing to a
  registry.
- Both apps still deploy independently — the monorepo is a source-control
  and dependency-management choice, not a deployment coupling.
