# ADR-0005: Mobile OTP Authentication with Opaque Session Tokens

## Status
Accepted

## Context
The store needs customer accounts before checkout is possible. Most Iranian
retail customers are more comfortable authenticating with a mobile number
than creating and remembering a password, and password databases are a
recurring source of breaches. We also do not yet have a real SMS provider
contract, so the design needs a boundary that lets that piece be swapped in
later without touching business logic.

## Decision
- Authentication is phone number + OTP only. No password is stored anywhere.
- OTP codes are 6 digits, expire after a short, configurable window, allow a
  limited number of verify attempts, and are rate-limited per phone number
  (cooldown) and per IP (`@nestjs/throttler` on the `auth` controller).
- OTP codes are hashed with HMAC-SHA256 (server-side secret) before storage,
  never stored in plain text.
- Sending the code goes through an `SmsProvider` interface. Development uses
  `MockSmsProvider`, which logs the code instead of sending a real SMS.
- Sessions are opaque random tokens (not JWT). The raw token goes to the
  browser in an `HttpOnly`, `SameSite=Lax` cookie; only its SHA-256 hash is
  stored in the database. A user can hold multiple sessions (multiple
  devices), each independently revocable.
- `/auth/otp/request` and `/auth/otp/verify` return the same generic
  response/error regardless of whether the phone number or code was valid,
  to avoid leaking account existence.

## Alternatives Considered
- **Password-based auth**: familiar, but adds password-reset flows, storage
  risk, and doesn't match how Iranian retail customers expect to log in.
- **JWT sessions**: stateless and simple to verify, but revoking a single
  compromised session (or "log out everywhere") is awkward without also
  maintaining a server-side blocklist — at which point most of JWT's
  simplicity advantage is gone anyway.
- **bcrypt/argon2 for OTP hashing**: appropriate for passwords, but overkill
  for a 6-digit code whose real defense is a short expiry, an attempt limit,
  and a request cooldown — not hash cost.

## Why This Decision
This fits the actual constraints: no password UX for customers, no SMS
provider decided yet (so an interface boundary is required regardless), and
a need to revoke individual sessions later (multi-device support, "log out
everywhere"). Opaque tokens make revocation a simple row delete instead of
a blocklist.

## Consequences
- Every request that needs identity does one extra database lookup (hash →
  session → user) instead of verifying a JWT signature locally. Acceptable
  at this scale; revisit only if this measurably becomes a bottleneck.
- Swapping in a real SMS provider later is a new class implementing
  `SmsProvider`, not a rewrite of `AuthService`.
- Session and OTP tables need periodic cleanup of expired rows eventually
  (not implemented yet — tracked as follow-up work, not a blocker for v1).
