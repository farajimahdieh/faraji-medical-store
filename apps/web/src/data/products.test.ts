import { describe, expect, it } from "vitest";
import { formatToman } from "./products";

describe("formatToman", () => {
  it("shows whole thousands as a number plus «هزار تومان»", () => {
    expect(formatToman(125_000)).toBe("۱۲۵ هزار تومان");
  });

  it("keeps large amounts in thousands with a grouping separator", () => {
    expect(formatToman(2_500_000)).toBe("۲٬۵۰۰ هزار تومان");
  });

  it("allows a single decimal when it stays exact", () => {
    expect(formatToman(6_500)).toBe("۶٫۵ هزار تومان");
  });

  it("never rounds an amount that does not fit the short form", () => {
    expect(formatToman(123_456)).toBe("۱۲۳٬۴۵۶ تومان");
  });

  it("leaves amounts under a thousand as plain تومان", () => {
    expect(formatToman(800)).toBe("۸۰۰ تومان");
    expect(formatToman(0)).toBe("۰ تومان");
  });
});
