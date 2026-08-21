// Normalizes user-typed search queries so Arabic-script Yeh/Kaf variants,
// half-spaces (ZWNJ) and stray whitespace don't cause an otherwise-matching
// product to be missed. Mirrors the normalization catalog import already
// applies to product names (see product-normalizer.ts) but also handles
// ZWNJ, which shoppers' keyboards produce more often than importers do.
export function normalizeSearchQuery(input: string): string {
  return input
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Same normalization, expressed as a Postgres SQL fragment so a column can
// be compared against a normalized query even if the stored text wasn't
// normalized at write time. `column` must be a trusted identifier (or
// identifier expression) — never pass user input here.
export function normalizedSqlColumn(column: string): string {
  return `regexp_replace(replace(translate(${column}, 'يك', 'یک'), E'\\u200c', ' '), '\\s+', ' ', 'g')`;
}
