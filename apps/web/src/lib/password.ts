// UX-only mirror of the backend rule in
// apps/api/src/auth/dto/activate-admin.dto.ts -- keep both in sync. The
// backend is the source of truth; this only avoids a round-trip for an
// obviously-weak password.
export const PASSWORD_MIN_LENGTH = 12;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_HINT = `حداقل ${PASSWORD_MIN_LENGTH} کاراکتر، شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص`;

export function isStrongPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && STRONG_PASSWORD_PATTERN.test(value);
}
