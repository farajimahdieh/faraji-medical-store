# ADR-0003: REST API Over GraphQL

## Status
Accepted

## Context
The NestJS backend needs an API style for the Next.js frontend (its only
consumer for the foreseeable future) to call.

## Decision
Use REST for the API.

## Alternatives Considered
- **GraphQL**: a single flexible endpoint with client-specified queries.

## Why This Decision
GraphQL's main advantages — letting many different, independently-evolving
clients each fetch exactly the fields they need, and avoiding
over/under-fetching across very different consumers — matter most when
there are multiple client types with different data needs (web, mobile
app, third-party integrators). Here there is one consumer (our own Next.js
app) that we control, so REST's simplicity (plain HTTP semantics, simpler
caching, no separate schema/resolver layer to maintain, and it matches the
developer's existing Express/REST experience) outweighs GraphQL's
flexibility, which would mostly go unused right now.

## Consequences
- Standard REST conventions (resource-oriented routes, HTTP verbs, status
  codes) apply throughout the API.
- If a second very different client (e.g. a mobile app with different data
  needs) appears later, this decision may need revisiting — noted here so
  that reconsideration starts from the right context instead of from
  scratch.
