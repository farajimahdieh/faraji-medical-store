// Shape + validation of a product content file (content/products/**/*.json).
// Pure -- no I/O -- so every rule is unit-tested in product-content.spec.ts.
// The same rules are written for humans/agents in
// .claude/skills/product-content/SKILL.md; keep the two in sync.

export interface ProductContentImage {
  // Exactly one of url / file: a manufacturer image URL, or a path (relative
  // to the repo root) to the store's own photo, e.g. data-private/photos/x.jpg
  url?: string;
  file?: string;
  alt: string;
  // Page the image (url) was taken from, so its origin stays auditable.
  source?: string;
}

export interface ProductContent {
  slug: string;
  name?: string;
  brand?: string;
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  features: string[];
  specifications: { name: string; value: string }[];
  faqs: { question: string; answer: string }[];
  images: ProductContentImage[];
  // Where the facts came from (manufacturer page, catalog PDF, box label).
  sources: string[];
}

export interface ContentCheck {
  content: ProductContent | null;
  errors: string[]; // block applying
  warnings: string[]; // applied, but worth a look in review
}

// Hard limits mirror DB column sizes; soft ranges are SEO guidance.
const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 170;
const MAX_IMAGES = 4;
const DESCRIPTION_WORDS = { min: 120, max: 350 };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function checkProductContent(raw: unknown): ContentCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { content: null, errors: ['file is not a JSON object'], warnings };
  }
  const data = raw as Record<string, unknown>;

  for (const key of [
    'slug',
    'shortDescription',
    'description',
    'metaTitle',
    'metaDescription',
  ]) {
    if (!isNonEmptyString(data[key])) errors.push(`"${key}" is required`);
  }
  for (const key of ['name', 'brand']) {
    if (data[key] !== undefined && !isNonEmptyString(data[key])) {
      errors.push(`"${key}" must be a non-empty string when present`);
    }
  }

  const metaTitle = data.metaTitle;
  if (isNonEmptyString(metaTitle) && metaTitle.length > META_TITLE_MAX) {
    errors.push(
      `"metaTitle" is ${metaTitle.length} chars (max ${META_TITLE_MAX})`,
    );
  }
  const metaDescription = data.metaDescription;
  if (isNonEmptyString(metaDescription)) {
    if (metaDescription.length > META_DESCRIPTION_MAX) {
      errors.push(
        `"metaDescription" is ${metaDescription.length} chars (max ${META_DESCRIPTION_MAX})`,
      );
    } else if (metaDescription.length < 90) {
      warnings.push('"metaDescription" is short (aim for 120-160 chars)');
    }
  }
  if (isNonEmptyString(data.description)) {
    const words = wordCount(data.description);
    if (words < DESCRIPTION_WORDS.min || words > DESCRIPTION_WORDS.max) {
      warnings.push(
        `"description" has ${words} words (aim for ${DESCRIPTION_WORDS.min}-${DESCRIPTION_WORDS.max})`,
      );
    }
  }

  const features = data.features ?? [];
  if (!Array.isArray(features) || !features.every(isNonEmptyString)) {
    errors.push('"features" must be an array of strings');
  }

  const specifications = data.specifications ?? [];
  if (
    !Array.isArray(specifications) ||
    !specifications.every(
      (spec: Record<string, unknown>) =>
        isNonEmptyString(spec?.name) && isNonEmptyString(spec?.value),
    )
  ) {
    errors.push('"specifications" must be an array of { name, value }');
  }

  const faqs = data.faqs ?? [];
  if (
    !Array.isArray(faqs) ||
    !faqs.every(
      (faq: Record<string, unknown>) =>
        isNonEmptyString(faq?.question) && isNonEmptyString(faq?.answer),
    )
  ) {
    errors.push('"faqs" must be an array of { question, answer }');
  } else if (faqs.length < 3) {
    warnings.push(`only ${faqs.length} FAQs (aim for 3-5)`);
  }

  const images = data.images ?? [];
  if (!Array.isArray(images)) {
    errors.push('"images" must be an array');
  } else {
    if (images.length > MAX_IMAGES) {
      errors.push(`${images.length} images (max ${MAX_IMAGES})`);
    }
    if (images.length === 0) {
      warnings.push('no images -- the product stays incomplete');
    }
    images.forEach((image: Record<string, unknown>, index: number) => {
      const label = `images[${index}]`;
      const hasUrl = isNonEmptyString(image?.url);
      const hasFile = isNonEmptyString(image?.file);
      if (hasUrl === hasFile) {
        errors.push(`${label} needs exactly one of "url" or "file"`);
      }
      if (hasUrl && !isHttpUrl(image.url as string)) {
        errors.push(`${label}.url must be an http(s) URL`);
      }
      if (hasFile && /(^|[\\/])\.\.([\\/]|$)/.test(image.file as string)) {
        errors.push(`${label}.file must not contain ".."`);
      }
      if (!isNonEmptyString(image?.alt)) {
        errors.push(`${label}.alt is required`);
      }
      if (hasUrl && !isNonEmptyString(image?.source)) {
        warnings.push(`${label} has no "source" page`);
      }
    });
  }

  const sources = data.sources;
  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    !sources.every(isNonEmptyString)
  ) {
    errors.push('"sources" must list where the facts came from');
  }

  if (errors.length > 0) return { content: null, errors, warnings };
  return {
    content: {
      ...(data as unknown as ProductContent),
      features: features as string[],
      specifications: specifications as ProductContent['specifications'],
      faqs: faqs as ProductContent['faqs'],
      images: images as ProductContentImage[],
    },
    errors,
    warnings,
  };
}
