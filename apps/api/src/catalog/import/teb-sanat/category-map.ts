// Maps teb-sanat.com's WooCommerce categories onto Faraji's catalog
// subcategories (all of which live under the "ارتوپدی، حرکتی و توانبخشی"
// root category). Three source categories bundle several kinds of product
// together, so those use a small keyword rule against the product name;
// everything else maps 1:1.

export interface FarajiSubcategory {
  name: string;
  slug: string;
}

export const FALLBACK_SUBCATEGORY: FarajiSubcategory = {
  name: 'سایر محصولات ارتوپدی',
  slug: 'other-orthopedic-products',
};

interface TebSanatCategoryRule {
  name: string;
  classify: (productName: string) => FarajiSubcategory;
}

// teb-sanat category id -> import rule. IDs come from
// GET /wp-json/wc/store/v1/products/categories on teb-sanat.com.
export const IMPORTABLE_TEB_SANAT_CATEGORIES: Record<
  number,
  TebSanatCategoryRule
> = {
  32: {
    name: 'زانوبند',
    classify: () => ({ name: 'زانوبند', slug: 'knee-support' }),
  },
  29: {
    name: 'شکم بند',
    classify: () => ({ name: 'شکم‌بند', slug: 'abdominal-belt' }),
  },
  34: {
    name: 'ستون فقرات گردنی',
    classify: () => ({ name: 'گردنبند طبی', slug: 'cervical-collar' }),
  },
  27: {
    name: 'کفی طبی',
    classify: () => ({ name: 'کفی طبی', slug: 'orthopedic-insole' }),
  },
  31: { name: 'آتل های اورژآنسی', classify: () => FALLBACK_SUBCATEGORY },
  36: { name: 'انواع بالشتک طبی', classify: () => FALLBACK_SUBCATEGORY },
  33: {
    name: 'جوراب های طبی',
    classify: () => ({ name: 'محصولات پا', slug: 'foot-products' }),
  },
  30: {
    name: 'ستون فقزات پشتی کمری',
    classify: (productName) =>
      productName.includes('قوز')
        ? { name: 'قوزبند', slug: 'posture-corrector' }
        : { name: 'کمربند طبی', slug: 'lumbar-support' },
  },
  15: {
    name: 'اندام فوقانی',
    classify: (productName) => {
      if (productName.includes('آویز')) {
        return { name: 'آویز دست', slug: 'arm-sling' };
      }
      if (productName.includes('آرنج')) {
        return { name: 'آرنج‌بند', slug: 'elbow-support' };
      }
      if (productName.includes('مچ')) {
        return { name: 'مچ‌بند', slug: 'wrist-support' };
      }
      if (productName.includes('شانه') || productName.includes('بازو')) {
        return { name: 'شانه و بازو', slug: 'shoulder-arm' };
      }
      return FALLBACK_SUBCATEGORY;
    },
  },
  16: {
    name: 'پا و مچ پا',
    classify: (productName) => {
      if (productName.includes('مچ پا') || productName.includes('مچ‌پا')) {
        return { name: 'مچ پا', slug: 'ankle-support' };
      }
      if (productName.includes('کفی')) {
        return { name: 'کفی طبی', slug: 'orthopedic-insole' };
      }
      if (productName.includes('محافظ')) {
        return { name: 'محافظ پا', slug: 'foot-guard' };
      }
      return { name: 'محصولات پا', slug: 'foot-products' };
    },
  },
  // "سایر محصولات" (id 35) was excluded from the first import pass because
  // it's an unscoped catch-all. Every one of its ~22 products was reviewed
  // by hand (see EXCLUDE_PRODUCT_IDS / NEEDS_REVIEW_PRODUCT_IDS below) —
  // this category itself just files the relevant ones into the fallback
  // subcategory, same as splints (31) and pillows (36).
  35: { name: 'سایر محصولات', classify: () => FALLBACK_SUBCATEGORY },
};

// Intentionally not crawled. Listed here (rather than just omitted) so the
// reason is documented and visible to anyone reading this file.
export const EXCLUDED_TEB_SANAT_CATEGORIES = [
  {
    id: 37,
    name: 'جدیدترین محصولات',
    reason:
      'cross-cutting tag, duplicates products already in other categories',
  },
];

// Products in "سایر محصولات" (category 35) that are clearly unrelated to
// orthopedics/mobility/rehab — reviewed by name individually, not guessed.
// Never imported.
export const EXCLUDE_PRODUCT_IDS = new Map<number, string>([
  [1194, 'ناف بند اطفال — infant umbilical care, not orthopedic'],
  [1182, 'ماسک قابل شستشو — general PPE mask, not orthopedic'],
  [1160, 'چشم بند — general eye mask, not orthopedic'],
  [1156, 'چشم بند یک طرفه بزرگسال — general eye mask, not orthopedic'],
  [1152, 'چشم بند مخصوص تنبلی چشم — pediatric ophthalmology, not orthopedic'],
]);

// Products in "سایر محصولات" that are plausibly relevant but genuinely
// ambiguous — imported, but held for a human decision rather than marked
// active.
export const NEEDS_REVIEW_PRODUCT_IDS = new Map<number, string>([
  [3206, 'بالشتک سر و گردن — comfort pillow vs. cervical support, unclear'],
  [
    1192,
    'غبغب بند/گوش و فک بند — support brace vs. cosmetic sleep aid, unclear',
  ],
  [
    1177,
    'باند کشی — generic elastic bandage vs. orthopedic support wrap, unclear',
  ],
]);

export type ProductInclusion = 'include' | 'needs_review' | 'exclude';

export function resolveProductInclusion(
  sourceProductId: number,
): ProductInclusion {
  if (EXCLUDE_PRODUCT_IDS.has(sourceProductId)) return 'exclude';
  if (NEEDS_REVIEW_PRODUCT_IDS.has(sourceProductId)) return 'needs_review';
  return 'include';
}

// A product can carry several category ids (e.g. a real one plus the
// "جدیدترین محصولات" tag, which always classifies as fallback). Prefer any
// id that resolves to a specific subcategory over one that resolves to the
// fallback, regardless of which id comes first.
export function classifyProduct(
  categoryIds: number[],
  productName: string,
): FarajiSubcategory {
  for (const id of categoryIds) {
    const rule = IMPORTABLE_TEB_SANAT_CATEGORIES[id];
    if (!rule) continue;
    const result = rule.classify(productName);
    if (result.slug !== FALLBACK_SUBCATEGORY.slug) return result;
  }
  return FALLBACK_SUBCATEGORY;
}
