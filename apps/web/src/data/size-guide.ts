// Size-selection guide shown on /size-guide and under the photos of every
// product that is sold in sizes. The tables follow Teb-o-Sanat's own size
// guide (teb-sanat.com); the owner asked to use the same tables for other
// brands too (e.g. Paksman).
//
// Never invent numbers here: every row must come from the Teb-o-Sanat
// guide. A section with no rows still links customers to the guide page,
// where it is shown with a "measure and ask us" note. The howToMeasure
// lines are placeholders until replaced with the guide's own wording.

export interface SizeGuideRow {
  /** Size label as it appears on the product, e.g. "M" or "سایز ۲". */
  size: string;
  /** Body measurement range in the section's unit, e.g. "۸۰ تا ۹۰". */
  range: string;
}

export interface SizeGuideSection {
  /** Anchor on /size-guide, e.g. "waist" → /size-guide#waist. */
  id: string;
  title: string;
  /** Where and how to measure, in plain Persian. */
  howToMeasure: string;
  unit: string;
  rows: SizeGuideRow[];
  /** Optional extra line under the table. */
  note?: string;
  /**
   * Words in a product's name that pick this section. Checked in section
   * order, so more specific sections (ankle) come before general ones.
   */
  keywords: string[];
}

export const SIZE_GUIDE_SOURCE = "https://teb-sanat.com";

export const sizeGuideSections: SizeGuideSection[] = [
  {
    id: "waist",
    title: "کمربند طبی، کرست و شکم‌بند",
    howToMeasure: "دور کمر را با متر خیاطی، در امتداد ناف و بدون فشار بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["کمربند", "کرست", "شکم بند", "لومبو", "فتق"],
  },
  {
    id: "neck",
    title: "گردنبند طبی",
    howToMeasure: "دور گردن را با متر خیاطی، در وسط گردن بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["گردنبند", "گردن بند"],
  },
  {
    id: "knee",
    title: "زانوبند",
    howToMeasure: "دور زانو را با متر خیاطی، از روی کشکک و با پای صاف بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["زانوبند", "زانو بند", "زانو"],
  },
  {
    id: "ankle",
    title: "قوزک‌بند و مچ‌بند پا",
    howToMeasure: "دور مچ پا را با متر خیاطی، درست بالای قوزک بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["قوزک", "مچ پا", "مچ بند پا", "مچبند پا"],
  },
  {
    id: "wrist",
    title: "مچ‌بند دست و شست‌بند",
    howToMeasure: "دور مچ دست را با متر خیاطی، در محل خط مچ بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["مچ بند", "مچبند", "مچ دست", "شست"],
  },
  {
    id: "elbow",
    title: "آرنج‌بند",
    howToMeasure: "دور آرنج را با متر خیاطی، با دست صاف بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["آرنج"],
  },
  {
    id: "arm-sling",
    title: "آویز دست و شانه‌بند",
    howToMeasure: "طول ساعد را از آرنج تا نوک انگشتان بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["آویز", "شانه", "بازوبند", "بازو بند"],
  },
  {
    id: "clavicle",
    title: "قوزبند",
    howToMeasure: "دور سینه را با متر خیاطی، زیر بغل بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["قوزبند", "قوز بند", "ترقوه"],
  },
  {
    id: "stockings",
    title: "جوراب واریس",
    howToMeasure: "صبح، پیش از ورم پا، دور مچ پا و دور ساق پا را بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["جوراب"],
  },
  {
    id: "foot",
    title: "کفی و کفش طبی",
    howToMeasure: "طول کف پا را از پاشنه تا نوک بلندترین انگشت بگیرید.",
    unit: "سانتی‌متر",
    rows: [],
    keywords: ["کفی", "کفش", "پاشنه"],
  },
];

// Single-size items ("تک سایز", "فری سایز") and products without a size
// don't need the guide.
const NO_SIZE = /^(|-|تک ?سایز|فری ?سایز|free ?size|one ?size)$/i;

export function hasSizeChoice(sizes: string[]): boolean {
  return sizes.some((size) => !NO_SIZE.test(size.trim()));
}

function normalize(text: string): string {
  return text
    .replace(/[‌‏‎]/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

export function findSizeGuideSection(productName: string): SizeGuideSection | null {
  const name = normalize(productName);
  return (
    sizeGuideSections.find((section) =>
      section.keywords.some((keyword) => name.includes(normalize(keyword))),
    ) ?? null
  );
}
