// Picks the product a Holoo group is merged into when its codes are already
// linked to several products (e.g. "اسپری طباسپت 30 میل" and "... 60 میل"
// were imported as separate pages before holoo-matches.json grouped them as
// sizes of one product). Pure -- unit-tested in merge-target.spec.ts.

export interface LinkedCode {
  code: string;
  productId: string;
}

// `codes` is the group's item order; `preferredProductId` is the product an
// override names in holoo-matches.json, if any. Order of preference: the
// override, then the product holding most of the group's codes, then the
// product holding the earliest code.
export function pickMergeTarget(
  codes: string[],
  links: LinkedCode[],
  preferredProductId?: string,
): string | null {
  const productIds = [...new Set(links.map((link) => link.productId))];
  if (productIds.length === 0) return null;
  if (preferredProductId && productIds.includes(preferredProductId)) {
    return preferredProductId;
  }
  const count = (id: string) =>
    links.filter((link) => link.productId === id).length;
  const firstIndex = (id: string) =>
    Math.min(
      ...links
        .filter((link) => link.productId === id)
        .map((link) => {
          const index = codes.indexOf(link.code);
          return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        }),
    );
  return productIds.sort(
    (a, b) => count(b) - count(a) || firstIndex(a) - firstIndex(b),
  )[0];
}
