"use client";

import { useState } from "react";
import {
  faDigits,
  gregorianToJalali,
  jalaliMonthLength,
  jalaliMonthName,
  jalaliToGregorian,
  todayJalali,
} from "@/lib/jalali";

interface Parts {
  jy: number | "";
  jm: number | "";
  jd: number | "";
}

function partsFromValue(value: string): Parts {
  if (!value) return { jy: "", jm: "", jd: "" };
  const { jy, jm, jd } = gregorianToJalali(value);
  return { jy, jm, jd };
}

function dayOptions(jy: number | "", jm: number | ""): number[] {
  const length = jy !== "" && jm !== "" ? jalaliMonthLength(jy, jm) : 31;
  return Array.from({ length }, (_, i) => i + 1);
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function selectClassName(hasError: boolean): string {
  return `h-11 flex-1 rounded-xl border px-2 text-navy outline-none transition-colors focus:ring-2 ${
    hasError
      ? "border-accent-red focus:border-accent-red focus:ring-accent-red/15"
      : "border-border focus:border-primary focus:ring-primary/15"
  }`;
}

export function JalaliDateInput({
  value,
  onChange,
  legend,
  hint,
  error,
  minYear,
}: {
  /** Gregorian 'YYYY-MM-DD', or '' when unset -- the value everywhere outside this component. */
  value: string;
  onChange: (value: string) => void;
  legend: string;
  hint?: string;
  error?: string;
  minYear?: number;
}) {
  const [parts, setParts] = useState<Parts>(() => partsFromValue(value));

  // Re-sync from an external value change (e.g. the form resets to the
  // server's data after a successful save) -- same "adjust during render"
  // pattern already used by AddressFormModal/MobileFiltersSheet instead of
  // an effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setParts(partsFromValue(value));
  }

  function commit(next: Parts) {
    setParts(next);
    if (next.jy === "" || next.jm === "" || next.jd === "") {
      onChange("");
      return;
    }
    // Clamp a now-out-of-range day (e.g. switching from a 31-day to a 29-day month).
    const jd = Math.min(next.jd, jalaliMonthLength(next.jy, next.jm));
    onChange(jalaliToGregorian(next.jy, next.jm, jd));
  }

  const currentYear = todayJalali().jy;
  const startYear = minYear ?? currentYear - 100;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
  const hasError = Boolean(error);

  return (
    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
      <legend className="mb-1.5 p-0 text-sm text-secondary-text">{legend}</legend>
      <div className="flex gap-2">
        <select
          aria-label="روز تولد"
          value={parts.jd}
          onChange={(e) => commit({ ...parts, jd: e.target.value ? Number(e.target.value) : "" })}
          className={selectClassName(hasError)}
        >
          <option value="">روز</option>
          {dayOptions(parts.jy, parts.jm).map((day) => (
            <option key={day} value={day}>
              {day.toLocaleString("fa-IR")}
            </option>
          ))}
        </select>
        <select
          aria-label="ماه تولد"
          value={parts.jm}
          onChange={(e) => commit({ ...parts, jm: e.target.value ? Number(e.target.value) : "" })}
          className={selectClassName(hasError)}
        >
          <option value="">ماه</option>
          {MONTHS.map((month) => (
            <option key={month} value={month}>
              {jalaliMonthName(month)}
            </option>
          ))}
        </select>
        <select
          aria-label="سال تولد"
          value={parts.jy}
          onChange={(e) => commit({ ...parts, jy: e.target.value ? Number(e.target.value) : "" })}
          className={selectClassName(hasError)}
        >
          <option value="">سال</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {faDigits(year)}
            </option>
          ))}
        </select>
      </div>
      {hint && !error && <p className="text-xs text-secondary-text">{hint}</p>}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </fieldset>
  );
}
