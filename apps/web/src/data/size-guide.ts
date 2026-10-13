// Size-selection guide shown on /size-guide and under the photos of every
// product that is sold in sizes. The tables are copied from Teb-o-Sanat's
// product pages (teb-sanat.com, "راهنمای سایز بندی" tab of each product);
// the owner asked to use the same tables for other brands too (e.g. Paksman).
//
// Never invent numbers here: every row must come from a Teb-o-Sanat table.
// Where Teb-o-Sanat publishes no table (varicose stockings, insoles) the
// section keeps no rows and the guide page asks customers to measure and
// ask us. Teb-o-Sanat uses different tables for some models of the same
// type (e.g. maternity vs. ordinary abdominal belts); those get their own
// section placed before the general one.

export interface SizeGuideRow {
  /** Size label as it appears on the product, e.g. "M" or "B35". */
  size: string;
  /** One value per column of the section, e.g. ["۸۰ تا ۹۰"]. */
  values: string[];
}

export interface SizeGuideSection {
  /** Anchor on /size-guide, e.g. "waist" → /size-guide#waist. */
  id: string;
  title: string;
  /** Where and how to measure, in Teb-o-Sanat's own terms. */
  howToMeasure: string;
  /** Header of each measurement column, with its unit. */
  columns: string[];
  rows: SizeGuideRow[];
  /** Optional extra line under the table. */
  note?: string;
  /**
   * Words in a product's name that pick this section. Checked in section
   * order, so more specific sections come before general ones.
   */
  keywords: string[];
}

export const SIZE_GUIDE_SOURCE = "https://teb-sanat.com";

const WAIST = "دور شکم از روی ناف (سانتی‌متر)";
const NECK = "دور گردن (سانتی‌متر)";
const KNEE = "دور زانو (سانتی‌متر)";
const WRIST = "دور مچ دست (سانتی‌متر)";
const CHEST = "دور سینه (سانتی‌متر)";
const WEIGHT = "وزن فرد (کیلوگرم)";
const SHOE = "شماره‌ی پا";
const FITS = "مناسب برای";

export const sizeGuideSections: SizeGuideSection[] = [
  // ---- Waist: belts, corsets, abdominal binders ----
  {
    id: "maternity-belt",
    title: "شکم‌بند بارداری",
    howToMeasure: "دور شکم را با متر خیاطی از روی ناف اندازه بگیرید.",
    columns: [WAIST],
    rows: [
      { size: "S", values: ["۷۰ تا ۸۰"] },
      { size: "M", values: ["۸۰ تا ۹۰"] },
      { size: "L", values: ["۹۰ تا ۱۰۰"] },
      { size: "XL", values: ["۱۰۰ تا ۱۱۰"] },
    ],
    keywords: ["شکم بند بارداری"],
  },
  {
    id: "liposuction-belt",
    title: "شکم‌بند لیپوساکشن",
    howToMeasure: "دور شکم را با متر خیاطی از روی ناف اندازه بگیرید.",
    columns: [WAIST],
    rows: [
      { size: "S", values: ["۸۵ تا ۹۵"] },
      { size: "M", values: ["۹۵ تا ۱۰۵"] },
      { size: "L", values: ["۱۰۵ تا ۱۱۵"] },
      { size: "XL", values: ["۱۱۵ تا ۱۲۵"] },
      { size: "XXL", values: ["۱۲۵ تا ۱۳۵"] },
    ],
    keywords: ["لیپوساکشن"],
  },
  {
    id: "slimming-neoprene-belt",
    title: "شکم‌بند لاغری ورزشی نئوپرن",
    howToMeasure: "دور شکم را با متر خیاطی از روی ناف اندازه بگیرید.",
    columns: [WAIST],
    rows: [
      { size: "S", values: ["کمتر از ۸۵"] },
      { size: "M", values: ["۸۵ تا ۹۵"] },
      { size: "L", values: ["۹۵ تا ۱۰۵"] },
      { size: "XL", values: ["۱۰۵ تا ۱۱۵"] },
      { size: "XXL", values: ["۱۱۵ تا ۱۲۵"] },
      { size: "XXXL", values: ["بیشتر از ۱۲۵"] },
    ],
    keywords: ["شکم بند لاغری ورزشی نئوپرن"],
  },
  {
    id: "pulley-belt",
    title: "کمربند قرقره‌ای",
    howToMeasure: "دور شکم را با متر خیاطی از روی ناف اندازه بگیرید.",
    columns: [WAIST],
    rows: [
      { size: "S", values: ["۷۰ تا ۸۵"] },
      { size: "M", values: ["۸۵ تا ۱۰۰"] },
      { size: "L", values: ["۱۰۰ تا ۱۱۵"] },
    ],
    keywords: ["کمربند قرقره"],
  },
  {
    id: "waist",
    title: "کمربند طبی، کرست و شکم‌بند",
    howToMeasure: "دور شکم را با متر خیاطی از روی ناف اندازه بگیرید.",
    columns: [WAIST],
    rows: [
      { size: "XS", values: ["۶۵ تا ۷۵"] },
      { size: "S", values: ["۷۵ تا ۸۵"] },
      { size: "M", values: ["۸۵ تا ۹۵"] },
      { size: "L", values: ["۹۵ تا ۱۰۵"] },
      { size: "XL", values: ["۱۰۵ تا ۱۱۵"] },
      { size: "XXL", values: ["۱۱۵ تا ۱۲۵"] },
      { size: "XXXL", values: ["۱۲۵ تا ۱۳۵"] },
    ],
    keywords: ["کمربند", "کرست", "شکم بند", "لومبو", "گرمکن کلیه", "فتق بند نافی"],
  },

  // ---- Neck collars ----
  {
    id: "neck-semi-rigid",
    title: "گردنبند طبی نیمه‌سخت",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "XS", values: ["۲۳ تا ۲۸"] },
      { size: "S", values: ["۲۸ تا ۳۳"] },
      { size: "M", values: ["۳۳ تا ۳۸"] },
      { size: "L", values: ["۳۸ تا ۴۲"] },
      { size: "XL", values: ["۴۲ تا ۴۷"] },
    ],
    keywords: ["گردنبند طبی نیمه سخت", "گردنبند نیمه سخت"],
  },
  {
    id: "neck-hard",
    title: "گردنبند طبی سخت و سخت چانه‌دار",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "XS", values: ["۲۷ تا ۳۲"] },
      { size: "S", values: ["۳۲ تا ۳۷"] },
      { size: "M", values: ["۳۷ تا ۴۲"] },
      { size: "L", values: ["۴۲ تا ۴۷"] },
    ],
    keywords: ["گردنبند طبی سخت", "گردنبند سخت"],
  },
  {
    id: "neck-philadelphia-emergency",
    title: "گردنبند فیلادلفیای اورژانسی",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "XS", values: ["۲۷ تا ۳۰"] },
      { size: "S", values: ["۳۰ تا ۳۵"] },
      { size: "M", values: ["۳۶ تا ۴۲"] },
      { size: "L", values: ["۴۳ تا ۴۷"] },
    ],
    keywords: ["فیلادلفیای اورژانسی", "فیلادلفیا اورژانسی"],
  },
  {
    id: "neck-philadelphia",
    title: "گردنبند فیلادلفیا",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "XS", values: ["افراد زیر ۵ سال"] },
      { size: "S", values: ["افراد ۵ سال به بالا"] },
      { size: "M", values: ["۲۸ تا ۳۴"] },
      { size: "L", values: ["۳۴ تا ۴۰"] },
      { size: "XL", values: ["۴۰ تا ۴۶"] },
    ],
    keywords: ["فیلادلفیا"],
  },
  {
    id: "neck-contoured",
    title: "گردنبند طبی اسفنجی قوس‌دار",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "S", values: ["۳۱ تا ۳۷"] },
      { size: "M", values: ["۳۷ تا ۴۳"] },
      { size: "L", values: ["۴۳ تا ۴۹"] },
    ],
    keywords: ["اسفنجی قوس"],
  },
  {
    id: "neck",
    title: "گردنبند طبی اسفنجی و چانه‌دار",
    howToMeasure: "دور گردن را با متر خیاطی اندازه بگیرید.",
    columns: [NECK],
    rows: [
      { size: "S", values: ["۲۸ تا ۳۳"] },
      { size: "M", values: ["۳۳ تا ۳۸"] },
      { size: "L", values: ["۳۸ تا ۴۲"] },
      { size: "XL", values: ["۴۲ تا ۴۶"] },
    ],
    note: "گردنبند چانه‌دار طب و صنعت در هر سایز دو مدل کوتاه و بلند دارد.",
    keywords: ["گردنبند", "گردن بند"],
  },

  // ---- Stockings (before the knee sections: "زیر زانو" is a length) ----
  {
    id: "anti-embolism-stockings",
    title: "جوراب ضد آمبولی",
    howToMeasure:
      "دور ران را ۱۵ سانتی‌متر بالای زانو، دور ساق را در پهن‌ترین قسمت ساق و دور مچ پا را با متر خیاطی اندازه بگیرید.",
    columns: [
      "دور ران، ۱۵ سانتی‌متر بالای زانو (سانتی‌متر)",
      "بیشترین دور ساق (سانتی‌متر)",
      "دور مچ پا (سانتی‌متر)",
    ],
    rows: [
      { size: "S", values: ["۴۴ تا ۵۰", "۲۹ تا ۳۳", "۱۸ تا ۲۰"] },
      { size: "M", values: ["۴۸ تا ۵۶", "۳۲ تا ۳۷", "۲۰ تا ۲۳"] },
      { size: "L", values: ["۵۳ تا ۶۲", "۳۶ تا ۴۱", "۲۳ تا ۲۶"] },
      { size: "XL", values: ["۵۸ تا ۶۷", "۴۰ تا ۴۵", "۲۶ تا ۲۹"] },
      { size: "XXL", values: ["۶۳ تا ۷۳", "۴۴ تا ۴۹", "۲۹ تا ۳۳"] },
      { size: "XXXL", values: ["۷۰ تا ۹۰", "۴۵ تا ۵۱", "۲۹ تا ۳۳"] },
    ],
    note: "دور ران فقط برای جوراب بالای ران لازم است؛ برای جوراب زیر زانو دور ساق و دور مچ پا کافی است.",
    keywords: ["ضد آمبولی"],
  },
  {
    id: "stockings",
    title: "جوراب واریس",
    howToMeasure:
      "طب و صنعت برای جوراب واریس جدول اندازه منتشر نکرده و مدل‌ها را با کد طول جوراب معرفی می‌کند.",
    columns: [],
    rows: [],
    note: "AB با کف زیر زانو (کوتاه)، AD با کف زیر زانو (بلند)، AF با کف بالای زانو، AG با کف بالای ران، BD بدون کف زیر زانو، BF بدون کف بالای زانو، BG بدون کف بالای ران، DF زانوبند.",
    keywords: ["جوراب"],
  },

  // ---- Knee ----
  {
    id: "knee-immobilizer",
    title: "ثابت‌کننده‌ی زانو",
    howToMeasure: "دور زانو را با متر خیاطی از روی کشکک اندازه بگیرید.",
    columns: [KNEE],
    rows: [
      { size: "XS", values: ["۲۶ تا ۳۰"] },
      { size: "S", values: ["۳۰ تا ۳۴"] },
      { size: "M", values: ["۳۴ تا ۳۸"] },
      { size: "L", values: ["۳۸ تا ۴۱"] },
      { size: "XL", values: ["۴۱ تا ۴۵"] },
      { size: "XXL", values: ["۴۵ تا ۴۹"] },
    ],
    keywords: ["ثابت کننده زانو"],
  },
  {
    id: "knee-rehab",
    title: "زانوبند توانبخشی با مفصل مدرج",
    howToMeasure: "دور زانو را با متر خیاطی از روی کشکک اندازه بگیرید.",
    columns: [KNEE],
    rows: [
      { size: "S", values: ["۲۹ تا ۳۳"] },
      { size: "M", values: ["۳۳ تا ۳۷"] },
      { size: "L", values: ["۳۷ تا ۴۱"] },
      { size: "XL", values: ["۴۱ تا ۴۶"] },
      { size: "XXL", values: ["۴۶ تا ۵۰"] },
    ],
    keywords: ["زانوبند توانبخشی", "زانوبند با مفصل مدرج"],
  },
  {
    id: "knee-elastic",
    title: "زانوبند کشی، مفصل‌دار و قابل تنظیم",
    howToMeasure: "دور زانو را با متر خیاطی از روی کشکک اندازه بگیرید.",
    columns: [KNEE],
    rows: [
      { size: "S", values: ["۳۲ تا ۳۶"] },
      { size: "M", values: ["۳۶ تا ۴۰"] },
      { size: "L", values: ["۴۰ تا ۴۴"] },
      { size: "XL", values: ["۴۴ تا ۴۸"] },
    ],
    keywords: [
      "زانوبند کشی",
      "زانو بند کشی",
      "زانوبند مفصل دار",
      "زانوبند نئوپرن مفصل دار",
      "زانوبند نئوپرن قابل تنظیم",
      "زانوبند نئوپرن چهار فنره قابل تنظیم",
    ],
  },
  {
    id: "knee",
    title: "زانوبند نئوپرن",
    howToMeasure: "دور زانو را با متر خیاطی از روی کشکک اندازه بگیرید.",
    columns: [KNEE],
    rows: [
      { size: "S", values: ["۳۲ تا ۳۶"] },
      { size: "M", values: ["۳۶ تا ۴۰"] },
      { size: "L", values: ["۴۰ تا ۴۴"] },
      { size: "XL", values: ["۴۴ تا ۴۷"] },
      { size: "XXL", values: ["۴۷ تا ۵۱"] },
    ],
    keywords: ["زانوبند", "زانو بند"],
  },

  // ---- Ankle, wrist, thumb, elbow ----
  {
    id: "ankle",
    title: "قوزک‌بند و مچ‌بند پا",
    howToMeasure: "دور قوزک پا را با متر خیاطی اندازه بگیرید.",
    columns: ["دور قوزک پا (سانتی‌متر)"],
    rows: [
      { size: "XS", values: ["۱۷ تا ۲۰"] },
      { size: "S", values: ["۲۰ تا ۲۳"] },
      { size: "M", values: ["۲۳ تا ۲۶"] },
      { size: "L", values: ["۲۶ تا ۲۹"] },
      { size: "XL", values: ["۲۹ تا ۳۲"] },
    ],
    keywords: ["قوزک", "مچ بند پا", "مچبند پا"],
  },
  {
    id: "wrist",
    title: "مچ‌بند دست",
    howToMeasure: "دور مچ دست را با متر خیاطی اندازه بگیرید.",
    columns: [WRIST],
    rows: [
      { size: "XS", values: ["۱۲ تا ۱۴"] },
      { size: "S", values: ["۱۴ تا ۱۶"] },
      { size: "M", values: ["۱۶ تا ۱۸"] },
      { size: "L", values: ["۱۸ تا ۲۰"] },
      { size: "XL", values: ["۲۰ تا ۲۲"] },
    ],
    keywords: ["مچ بند", "مچبند", "مچ دست"],
  },
  {
    id: "thumb",
    title: "ارتوز شست",
    howToMeasure: "دور مچ دست را با متر خیاطی اندازه بگیرید.",
    columns: [WRIST],
    rows: [
      { size: "S", values: ["۱۴ تا ۱۶"] },
      { size: "M", values: ["۱۶ تا ۱۸"] },
      { size: "L", values: ["۱۸ تا ۲۰"] },
    ],
    keywords: ["ارتوز شست", "شست بند"],
  },
  {
    id: "elbow",
    title: "آرنج‌بند",
    howToMeasure: "دور آرنج را با متر خیاطی از روی خط آرنج اندازه بگیرید.",
    columns: ["دور آرنج از روی خط آرنج (سانتی‌متر)"],
    rows: [
      { size: "XS", values: ["۱۸ تا ۲۱"] },
      { size: "S", values: ["۲۱ تا ۲۴"] },
      { size: "M", values: ["۲۴ تا ۲۷"] },
      { size: "L", values: ["۲۷ تا ۳۰"] },
      { size: "XL", values: ["۳۰ تا ۳۳"] },
      { size: "XXL", values: ["۳۳ تا ۳۶"] },
      { size: "XXXL", values: ["۳۶ تا ۳۹"] },
    ],
    keywords: ["آرنج"],
  },

  // ---- Arm, shoulder, chest, back ----
  {
    id: "arm-sling-open",
    title: "آویز دست شانه‌ای دوطرف باز",
    howToMeasure: "سایز را بر اساس سن و اندام فرد انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "XXS", values: ["نوزادان"] },
      { size: "XS", values: ["خردسالان"] },
      { size: "S", values: ["کودکان و نوجوانان"] },
      { size: "M", values: ["بالغین میانه‌اندام"] },
      { size: "L", values: ["بالغین درشت‌اندام و قدبلند"] },
    ],
    keywords: ["آویز دست شانه ای"],
  },
  {
    id: "arm-sling",
    title: "آویز دست",
    howToMeasure: "سایز را بر اساس سن و قد فرد انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "XXS", values: ["نوزادان"] },
      { size: "XS", values: ["خردسالان"] },
      { size: "S", values: ["کودکان و نوجوانان"] },
      { size: "M", values: ["افراد بالغ کوتاه‌قد"] },
      { size: "L", values: ["افراد بالغ با قد متوسط"] },
      { size: "XL", values: ["افراد بالغ بلندقد"] },
    ],
    keywords: ["آویز"],
  },
  {
    id: "shoulder-immobilizer",
    title: "ثابت‌کننده‌ی شانه و بازو",
    howToMeasure: "دور سینه را با متر خیاطی اندازه بگیرید.",
    columns: [CHEST],
    rows: [
      { size: "XXS", values: ["نوزادان"] },
      { size: "XS", values: ["خردسالان"] },
      { size: "S", values: ["۷۵ تا ۹۰"] },
      { size: "M", values: ["۹۰ تا ۹۵"] },
      { size: "L", values: ["۹۵ تا ۱۰۰"] },
    ],
    keywords: ["ثابت کننده شانه"],
  },
  {
    id: "shoulder-abduction",
    title: "ابداکشن بریس شانه",
    howToMeasure: "دور سینه را با متر خیاطی اندازه بگیرید.",
    columns: [CHEST],
    rows: [
      { size: "S", values: ["۷۰ تا ۹۰"] },
      { size: "M", values: ["۹۰ تا ۱۱۰"] },
      { size: "L", values: ["۱۱۰ تا ۱۳۰"] },
    ],
    keywords: ["ابداکشن"],
  },
  {
    id: "shoulder",
    title: "شانه‌بند",
    howToMeasure: "دور بازو را با متر خیاطی اندازه بگیرید.",
    columns: ["دور بازو (سانتی‌متر)"],
    rows: [
      { size: "S", values: ["۲۲ تا ۲۶"] },
      { size: "M", values: ["۲۶ تا ۳۰"] },
      { size: "L", values: ["۳۰ تا ۳۴"] },
      { size: "XL", values: ["۳۴ تا ۳۸"] },
    ],
    keywords: ["شانه بند"],
  },
  {
    id: "chest",
    title: "نگهدارنده‌ی قفسه‌ی سینه",
    howToMeasure: "دور سینه را با متر خیاطی اندازه بگیرید.",
    columns: [CHEST],
    rows: [
      { size: "XS", values: ["کودکان زیر ۱۲ سال و افراد لاغراندام"] },
      { size: "S", values: ["۸۵ تا ۹۵"] },
      { size: "M", values: ["۹۵ تا ۱۰۵"] },
      { size: "L", values: ["۱۰۵ تا ۱۱۵"] },
      { size: "XL", values: ["۱۱۵ تا ۱۲۵"] },
    ],
    keywords: ["قفسه سینه"],
  },
  {
    id: "posture",
    title: "قوزبند و کتف‌بند",
    howToMeasure: "سایز قوزبند بر اساس وزن فرد انتخاب می‌شود.",
    columns: [WEIGHT],
    rows: [
      { size: "XS", values: ["۲۰ تا ۴۰"] },
      { size: "S", values: ["۴۰ تا ۶۰"] },
      { size: "M", values: ["۶۰ تا ۸۰"] },
      { size: "L", values: ["۸۰ تا ۱۰۰"] },
      { size: "XL", values: ["۱۰۰ تا ۱۲۰"] },
    ],
    keywords: ["قوزبند", "قوز بند", "کتف بند"],
  },
  {
    id: "clavicle",
    title: "بانداژ ترقوه",
    howToMeasure: "سایز بانداژ ترقوه بر اساس وزن فرد انتخاب می‌شود.",
    columns: [WEIGHT],
    rows: [
      { size: "S", values: ["۳۰ تا ۴۰"] },
      { size: "M", values: ["۴۰ تا ۶۰"] },
      { size: "L", values: ["۶۰ تا ۸۰"] },
      { size: "XL", values: ["۸۰ تا ۱۰۰"] },
    ],
    keywords: ["ترقوه"],
  },

  // ---- Foot ----
  {
    id: "cast-shoe-reha",
    title: "کفش گچ مدل رها",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["کوچک‌تر از ۳۵"] },
      { size: "M", values: ["۳۵ تا ۳۹"] },
      { size: "L", values: ["بزرگ‌تر از ۳۹"] },
    ],
    keywords: ["کفش گچ مدل رها"],
  },
  {
    id: "cast-shoe",
    title: "کفش گچ",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["۲۹ تا ۳۱"] },
      { size: "M", values: ["۳۲ تا ۳۵"] },
      { size: "L", values: ["۳۶ تا ۳۹"] },
      { size: "XL", values: ["۴۰ تا ۴۲"] },
      { size: "XXL", values: ["۴۳ تا ۴۵"] },
    ],
    keywords: ["کفش گچ"],
  },
  {
    id: "hallux-bandage",
    title: "بانداژ هالوکس والگوس",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["کوچک‌تر از ۴۱"] },
      { size: "L", values: ["۴۱ و بزرگ‌تر"] },
    ],
    keywords: ["بانداژ هالوکس"],
  },
  {
    id: "hallux-splint-set",
    title: "مجموعه اسپلینت هالوکس والگوس",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["۳۹ و کوچک‌تر (چپ / راست)"] },
      { size: "L", values: ["۴۰ و بزرگ‌تر (چپ / راست)"] },
    ],
    keywords: ["مجموعه اسپلینت هالوکس"],
  },
  {
    id: "toe-spacer",
    title: "لاانگشتی مدل طب و صنعت",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["۳۹ و کوچک‌تر"] },
      { size: "L", values: ["۴۰ و بزرگ‌تر"] },
    ],
    keywords: ["لا انگشتی مدل طب و صنعت"],
  },
  {
    id: "toe-spacer-silicone",
    title: "لاانگشتی سیلیکونی",
    howToMeasure: "سایز را بر اساس اندازه‌ی انگشتان انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "S", values: ["انگشتان کوچک"] },
      { size: "M", values: ["بانوان"] },
      { size: "L", values: ["آقایان"] },
    ],
    keywords: ["لا انگشتی سیلیکونی"],
  },
  {
    id: "metatarsal-pad",
    title: "پد متاتارس",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "S", values: ["۴۰ و کوچک‌تر"] },
      { size: "L", values: ["۴۱ و بزرگ‌تر"] },
    ],
    keywords: ["پد متاتارس"],
  },
  {
    id: "heel-pad",
    title: "پد پاشنه سیلیکونی",
    howToMeasure: "سایز را بر اساس شماره‌ی پا انتخاب کنید.",
    columns: [SHOE],
    rows: [
      { size: "M", values: ["۳۷ تا ۴۰"] },
      { size: "L", values: ["۴۱ تا ۴۵"] },
    ],
    keywords: ["پد پاشنه سیلیکونی"],
  },
  {
    id: "heel-cover",
    title: "پاشنه‌پوش ضد ترک پا",
    howToMeasure: "سایز را بر اساس اندازه‌ی پا انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "S", values: ["بانوان"] },
      { size: "L", values: ["آقایان"] },
    ],
    keywords: ["پاشنه پوش"],
  },
  {
    id: "foot",
    title: "کفی طبی",
    howToMeasure:
      "کفی‌های طب و صنعت با شماره‌ی کفش انتخاب می‌شوند و جدول اندازه‌ی جداگانه ندارند.",
    columns: [],
    rows: [],
    keywords: ["کفی"],
  },

  // ---- Other ----
  {
    id: "cast-protector",
    title: "محافظ گچ و پانسمان در حمام",
    howToMeasure: "دور دست یا پا را ۵ سانتی‌متر بالاتر از گچ یا پانسمان با متر خیاطی اندازه بگیرید.",
    columns: ["دور عضو، ۵ سانتی‌متر بالاتر از گچ یا پانسمان (سانتی‌متر)"],
    rows: [
      { size: "A20", values: ["۱۵ تا ۲۰"] },
      { size: "A25", values: ["۲۰ تا ۲۵"] },
      { size: "A30", values: ["۲۵ تا ۳۰"] },
      { size: "A35", values: ["۳۰ تا ۳۵"] },
      { size: "A40", values: ["۳۵ تا ۴۰"] },
      { size: "A45", values: ["۴۰ تا ۴۵"] },
      { size: "A50", values: ["۴۵ تا ۵۰"] },
      { size: "B35", values: ["۳۰ تا ۳۵"] },
      { size: "B40", values: ["۳۵ تا ۴۰"] },
      { size: "B45", values: ["۴۰ تا ۴۵"] },
      { size: "B50", values: ["۴۵ تا ۵۰"] },
      { size: "B55", values: ["۵۰ تا ۵۵"] },
    ],
    note: "سایزهای A برای مدل کوتاه و سایزهای B برای مدل بلند است.",
    keywords: ["محافظ گچ"],
  },
  {
    id: "chin-strap",
    title: "غبغب‌بند / گوش و فک‌بند",
    howToMeasure: "سایز را بر اساس جنسیت فرد انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "S", values: ["بانوان"] },
      { size: "L", values: ["آقایان"] },
    ],
    keywords: ["غبغب بند", "فک بند"],
  },
  {
    id: "mask",
    title: "ماسک قابل شستشو",
    howToMeasure: "سایز را بر اساس سن فرد انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "S", values: ["کودکان"] },
      { size: "L", values: ["بزرگسالان"] },
    ],
    keywords: ["ماسک قابل شستشو"],
  },
  {
    id: "neck-cushion",
    title: "بالشتک سر و گردن",
    howToMeasure: "سایز را بر اساس وزن فرد انتخاب کنید.",
    columns: [WEIGHT],
    rows: [
      { size: "S", values: ["کمتر از ۶۰"] },
      { size: "L", values: ["بیشتر از ۶۰"] },
    ],
    keywords: ["بالشتک سر و گردن"],
  },
  {
    id: "pillow",
    title: "بالش طبی",
    howToMeasure: "سایز را بر اساس قد و اندام فرد انتخاب کنید.",
    columns: [FITS],
    rows: [
      { size: "S", values: ["افراد ریزنقش و کوتاه‌قد"] },
      { size: "M", values: ["افراد میانه‌اندام با قد متوسط"] },
      { size: "L", values: ["افراد درشت‌اندام و بلندقد"] },
    ],
    keywords: ["بالش طبی"],
  },
];

// Single-size items ("تک سایز", "فری سایز"), products without a size and
// left/right variants don't need the guide.
const NO_SIZE = /^(|-|تک ?سایز|فری ?سایز|free ?size|one ?size|راست|چپ)$/i;

export function hasSizeChoice(sizes: string[]): boolean {
  return sizes.some((size) => !NO_SIZE.test(size.trim()));
}

function normalize(text: string): string {
  return text
    .replace(/[ً-ٰٟ]/g, "")
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
