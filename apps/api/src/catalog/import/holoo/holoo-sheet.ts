// Pure parsing/grouping for Holoo (accounting software) Excel exports --
// no DB, no I/O, so every rule here is unit-tested in holoo-sheet.spec.ts.
//
// Expected columns (matched by header text, order doesn't matter):
//   نام کالا | تعداد | قیمت خرید | قیمت فروش | کد کالا
// Prices in Holoo are Rial; the site stores Toman (see ProductVariant.price).
// "قیمت خرید" (purchase price) is read ONLY to sanity-check the sale price
// and is never returned to callers -- it must not reach the database.

export type SheetCell = string | number | boolean | Date | null | undefined;

export interface HolooItem {
  rowNumber: number; // 1-based, as shown in Excel
  code: string;
  name: string;
  stock: number | null;
  // Null when the sale price is missing or failed a sanity check -- the
  // variant is then imported unsellable instead of with a wrong price.
  priceToman: number | null;
  size: string | null;
  baseName: string;
  issues: string[];
}

export interface HolooGroup {
  key: string;
  name: string;
  items: HolooItem[];
}

export interface ParsedSheet {
  items: HolooItem[];
  // Problems that aren't tied to one row (missing columns, duplicates).
  errors: string[];
}

const HEADER_ALIASES = {
  name: ['نام کالا', 'شرح کالا', 'نام'],
  code: ['کد کالا', 'کد'],
  stock: ['تعداد', 'موجودی'],
  salePrice: ['قیمت فروش', 'فی فروش'],
  purchasePrice: ['قیمت خرید', 'فی خرید'],
} as const;

// A sale price this many times the purchase price is almost always a typo
// (an extra zero) -- flagged rather than published.
const MAX_MARKUP = 3;

export function normalizePersian(input: string): string {
  return input
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Dimension sizes like "10*15", "10 × 15", "7.5*7.5" -- the way Holoo names
// the same dressing in several sizes. Volume/weight ("30 میل", "2 گرم") is
// deliberately NOT treated as a size: those are often different products.
const DIMENSION_RE = /(\d+(?:\.\d+)?)\s*[*×xX]\s*(\d+(?:\.\d+)?)/;
const WIDTH_RE = /(\d+(?:\.\d+)?)\s*سانت(?:ی\s*متر)?/;
// "سایز 90", "سایز80" (bras, splints, stockings).
const NUMBERED_SIZE_RE = /سایز\s*(\d+)/;
// Garment sizes; often glued to the neighbouring Persian word ("قوس دارS",
// "Lطب و صنعت"), so only Latin letters/digits count as a word boundary.
// Multi-letter forms match in any case ("xxxxl", "2xl"); single letters only
// in upper case, so "5m" (metres) is not read as size M.
const MULTI_LETTER_SIZE_RE =
  /(?<![A-Za-z0-9])(x{1,4}l|x{1,3}s|[2-5]xl)(?![A-Za-z0-9])/i;
const SINGLE_LETTER_SIZE_RE = /(?<![A-Za-z0-9])([SML])(?![A-Za-z0-9])/;
// Compression-stocking size/length codes (AD = calf length, size A, ...).
const STOCKING_CODE_RE = /(?<![A-Za-z])(AB|AD|AF|AG|BD|BF|BG|DF)(?![A-Za-z])/;
const ONE_SIZE = 'تک سایز';

function normalizeLetterSize(raw: string): string {
  const upper = raw.toUpperCase();
  const numbered = /^([2-5])XL$/.exec(upper);
  return numbered ? `${'X'.repeat(Number(numbered[1]))}L` : upper;
}

export function splitSize(rawName: string): {
  baseName: string;
  size: string | null;
} {
  const name = normalizePersian(rawName);
  const cut = (match: RegExpExecArray, size: string) => ({
    baseName: tidy(name.replace(match[0], ' ')),
    size,
  });

  const dimension = DIMENSION_RE.exec(name);
  if (dimension) return cut(dimension, `${dimension[1]}×${dimension[2]}`);
  const width = WIDTH_RE.exec(name);
  if (width) return cut(width, `${width[1]} سانت`);
  const numbered = NUMBERED_SIZE_RE.exec(name);
  if (numbered) return cut(numbered, numbered[1]);
  const multi = MULTI_LETTER_SIZE_RE.exec(name);
  if (multi) return cut(multi, normalizeLetterSize(multi[1]));
  const single = SINGLE_LETTER_SIZE_RE.exec(name);
  if (single) return cut(single, single[1]);
  if (name.includes('جوراب')) {
    const stocking = STOCKING_CODE_RE.exec(name);
    if (stocking) return cut(stocking, stocking[1]);
  }
  if (name.includes(ONE_SIZE)) {
    return { baseName: tidy(name.replace(ONE_SIZE, ' ')), size: ONE_SIZE };
  }
  return { baseName: name, size: null };
}

// Holoo spells the same product with and without spaces ("زانو بند" /
// "زانوبند", "لیپو ساکشن" / "لیپوساکشن"), so grouping ignores spaces.
export function groupingKey(baseName: string): string {
  return baseName.replace(/\s+/g, '');
}

function tidy(name: string): string {
  return name
    .replace(/\(\s*\)/g, ' ')
    .replace(/(^|\s)سایز(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findColumns(
  header: SheetCell[],
): Record<keyof typeof HEADER_ALIASES, number> {
  const normalized = header.map((cell) =>
    typeof cell === 'string' ? normalizePersian(cell) : '',
  );
  const result = {} as Record<keyof typeof HEADER_ALIASES, number>;
  for (const key of Object.keys(
    HEADER_ALIASES,
  ) as (keyof typeof HEADER_ALIASES)[]) {
    result[key] = normalized.findIndex((cell) =>
      (HEADER_ALIASES[key] as readonly string[]).includes(cell),
    );
  }
  return result;
}

function toNumber(cell: SheetCell): number | null {
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null;
  if (typeof cell === 'string') {
    const cleaned = normalizePersian(cell).replace(/[,٬]/g, '');
    if (cleaned === '') return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function toText(cell: SheetCell): string {
  if (cell === null || cell === undefined) return '';
  return normalizePersian(String(cell));
}

export function parseHolooSheet(rows: SheetCell[][]): ParsedSheet {
  const errors: string[] = [];
  const headerIndex = rows.findIndex((row) => {
    const cols = findColumns(row);
    return cols.name >= 0 && cols.code >= 0;
  });
  if (headerIndex < 0) {
    return {
      items: [],
      errors: ['ستون‌های «نام کالا» و «کد کالا» در فایل پیدا نشد'],
    };
  }

  const cols = findColumns(rows[headerIndex]);
  if (cols.salePrice < 0) errors.push('ستون «قیمت فروش» پیدا نشد');
  if (cols.stock < 0) errors.push('ستون «تعداد» یا «موجودی» پیدا نشد');

  const items: HolooItem[] = [];
  const seenCodes = new Map<string, number>();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const name = toText(row[cols.name]);
    const code = toText(row[cols.code]);
    if (!name && !code) return; // blank line

    const issues: string[] = [];
    if (!code) issues.push('کد کالا ندارد');
    if (!name) issues.push('نام کالا ندارد');

    if (code) {
      const firstRow = seenCodes.get(code);
      if (firstRow !== undefined) {
        errors.push(`کد ${code} تکراری است (ردیف ${firstRow} و ${rowNumber})`);
      } else {
        seenCodes.set(code, rowNumber);
      }
    }

    let stock = cols.stock >= 0 ? toNumber(row[cols.stock]) : null;
    if (stock !== null && !Number.isInteger(stock)) {
      issues.push(`موجودی اعشاری است (${stock}) -- رو به پایین گرد شد`);
      stock = Math.floor(stock);
    }
    if (stock !== null && stock < 0) {
      issues.push(`موجودی منفی است (${stock}) -- صفر در نظر گرفته شد`);
      stock = 0;
    }

    const saleRial = cols.salePrice >= 0 ? toNumber(row[cols.salePrice]) : null;
    const purchaseRial =
      cols.purchasePrice >= 0 ? toNumber(row[cols.purchasePrice]) : null;
    let priceToman: number | null = null;

    if (saleRial === null || saleRial <= 0) {
      issues.push('قیمت فروش ندارد');
    } else if (saleRial % 10 !== 0) {
      issues.push(`قیمت فروش (${saleRial} ریال) به تومان رُند نمی‌شود`);
    } else if (
      purchaseRial !== null &&
      purchaseRial > 0 &&
      saleRial < purchaseRial
    ) {
      issues.push('قیمت فروش کمتر از قیمت خرید است');
    } else if (
      purchaseRial !== null &&
      purchaseRial > 0 &&
      saleRial > purchaseRial * MAX_MARKUP
    ) {
      issues.push(
        `قیمت فروش بیش از ${MAX_MARKUP} برابر قیمت خرید است -- احتمالاً صفر اضافه`,
      );
    } else {
      priceToman = saleRial / 10;
    }

    const { baseName, size } = splitSize(name);
    items.push({
      rowNumber,
      code,
      name,
      stock,
      priceToman,
      size,
      baseName,
      issues,
    });
  });

  return { items, errors };
}

// Rows whose names differ only by a dimension size become one product with
// one variant per size. A size repeated inside a group (two brands sharing
// a base name, say) can't be told apart, so those rows stay separate
// products instead of silently overwriting each other.
export function groupBySize(items: HolooItem[]): HolooGroup[] {
  const buckets = new Map<string, HolooItem[]>();
  for (const item of items) {
    const key = groupingKey(item.baseName);
    const bucket = buckets.get(key) ?? [];
    bucket.push(item);
    buckets.set(key, bucket);
  }

  const groups: HolooGroup[] = [];
  for (const [key, bucket] of buckets) {
    const sizes = bucket.map((item) => item.size ?? '');
    const sizesUnique = new Set(sizes).size === sizes.length;
    const hasUnsized = bucket.some((item) => item.size === null);

    if (bucket.length > 1 && sizesUnique && !hasUnsized) {
      groups.push({ key, name: bucket[0].baseName, items: bucket });
      continue;
    }
    for (const item of bucket) {
      if (bucket.length > 1) {
        item.issues.push('نام مشابه کالای دیگری است ولی ادغام نشد');
      }
      groups.push({
        key: `${key}#${item.code}`,
        name: item.name,
        items: [item],
      });
    }
  }
  return groups;
}
