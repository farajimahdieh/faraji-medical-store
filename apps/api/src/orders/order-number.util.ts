// Human-facing order identifier -- e.g. "F-20260826-483920". No DB sequence
// exists in this schema yet, so this stays app-generated; the caller must
// retry on a unique-constraint violation (astronomically unlikely, but the
// column's unique index is the real guarantee, not this function).
export function generateOrderNumber(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `F-${y}${m}${d}-${suffix}`;
}
