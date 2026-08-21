// Client-side only — no backend/account storage. A simple JSON array of
// search terms, most recent first.
const STORAGE_KEY = "faraji:search-history";
const MAX_STORED = 10;
export const MAX_VISIBLE_SEARCH_HISTORY = 5;

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Private browsing, disabled storage, corrupted JSON, etc. — treat as empty.
    return [];
  }
}

function writeRaw(terms: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch {
    // Quota exceeded or storage unavailable — nothing sensible to do here.
  }
}

export function getSearchHistory(): string[] {
  return readRaw();
}

// Adds `term` to the front of the history, removing any earlier duplicate
// (case/whitespace-insensitive) rather than storing it twice.
export function addSearchHistory(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return readRaw();

  const withoutDuplicate = readRaw().filter(
    (item) => item.trim().toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...withoutDuplicate].slice(0, MAX_STORED);
  writeRaw(next);
  return next;
}

export function removeSearchHistoryItem(term: string): string[] {
  const next = readRaw().filter((item) => item !== term);
  writeRaw(next);
  return next;
}

export function clearSearchHistory(): string[] {
  writeRaw([]);
  return [];
}
