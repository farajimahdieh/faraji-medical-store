# ADR-0007: Admin Login Uses Password + OTP, Customers Stay OTP-Only

## Status
Accepted

## Context
ADR-0005 deliberately keeps customer authentication password-free. Staff
accounts (admin/super_admin) are a different threat model: a small,
high-value set of accounts that can create/edit products and (for
super_admin) create other admins, so a second, harder-to-hijack factor is
worth the extra friction that would be wrong to impose on shoppers.

## Decision
- Admin/super_admin accounts get a `passwordHash` on a new `AdminProfile`
  table (one-to-one with `User`), not on `User` itself — this keeps ADR-0005
  literally true for customers and keeps admin-only fields off every
  customer row.
- Login is three steps: phone + password, then a 6-digit OTP sent over the
  existing SMS/OTP infrastructure. The OTP table gained a `purpose` column
  (`customer_login` | `admin_login`) so a code issued for one flow can't be
  replayed in the other.
- Wrong phone, wrong password, disabled account, and locked account all
  produce the same generic response and never trigger an OTP send — same
  non-enumeration stance as ADR-0005.
- Failed password attempts are tracked per `AdminProfile`
  (`failedLoginAttempts`/`lockedUntil`), independent of the OTP's own
  attempt limit, since a memorized secret needs stronger brute-force
  protection than a short-lived 6-digit code.
- Sessions are the same opaque-token `Session` rows customers get; `POST
  /auth/logout` and `GET /auth/me` are reused as-is. Authorization is a
  separate concern (`RolesGuard`/`@Roles()`), not folded into login.

## Alternatives Considered
- **Password on `User` directly**: simpler, but contradicts ADR-0005's
  explicit "no password anywhere" for the same entity, and would put
  admin-only columns on every customer row.
- **JWT/separate session mechanism for admins**: would duplicate
  `SessionGuard`/cookie handling for no real benefit — RBAC is enforced at
  the authorization layer regardless of how the session was created.

## Consequences
- Bootstrapping the first super_admin needs a seed script
  (`seed:super-admin`), since admin creation itself requires an existing
  super_admin session.
- Adding TOTP/authenticator-app support later is additive: a nullable
  `totpSecret`/`totpEnabled` on `AdminProfile` and a 4th verify branch in
  `AdminAuthService` — `RolesGuard` and the product/admin API surface don't
  need to change.
