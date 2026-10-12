// Builds the starting point of a content file for a product that has none
// yet -- known facts (slug, Holoo name, sizes) filled in, everything that
// needs research left empty so `content:apply --dry-run` keeps failing
// until a writer completes it.

export interface ScaffoldInput {
  slug: string;
  name: string;
  accountingNames: string[];
  sizes: string[];
}

export function buildContentSkeleton(
  input: ScaffoldInput,
): Record<string, unknown> {
  const realSizes = input.sizes.filter((size) => size !== 'استاندارد');
  return {
    slug: input.slug,
    name: input.name,
    brand: '',
    shortDescription: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    features: [],
    specifications:
      realSizes.length > 0
        ? [{ name: 'سایزهای موجود', value: realSizes.join('، ') }]
        : [],
    faqs: [],
    images: [],
    sources: [],
    // Context for the writer; ignored by content:apply. Delete when done.
    _holooNames: input.accountingNames,
  };
}
