// Gregorian <-> Jalali (Persian) calendar conversion. Pure integer math, no
// Date object, no timezone involved anywhere -- this is the standard
// algorithm (Borkowski's "Calendrical Calculations", as popularized by the
// jalaali-js package) reimplemented locally rather than adding a dependency
// for what's ultimately ~80 lines of arithmetic.

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1 || jd > jalaliMonthLength(jy, jm)) return false;
  return true;
}

/** 'YYYY-MM-DD' (Gregorian) -> Jalali y/m/d. */
export function gregorianToJalali(dateStr: string): JalaliDate {
  const [gy, gm, gd] = dateStr.split("-").map(Number);
  return d2j(g2d(gy, gm, gd));
}

/** Jalali y/m/d -> 'YYYY-MM-DD' (Gregorian). Assumes an already-valid date. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd));
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function jalaliMonthName(jm: number): string {
  return JALALI_MONTH_NAMES[jm - 1] ?? "";
}

// A 4-digit year run through toLocaleString("fa-IR") gets a thousands
// separator inserted ("۱٬۳۷۸") -- years are never grouped, so grouping must
// be disabled explicitly.
export function faDigits(n: number): string {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

/** e.g. "۲۱ مرداد ۱۳۷۸" */
export function formatJalaliLong(jy: number, jm: number, jd: number): string {
  return `${faDigits(jd)} ${jalaliMonthName(jm)} ${faDigits(jy)}`;
}

/** Today's date in the Jalali calendar, computed from local (not UTC) date parts. */
export function todayJalali(): JalaliDate {
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  return d2j(g2d(gy, gm, gd));
}
