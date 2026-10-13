import { describe, expect, it } from "vitest";
import { findSizeGuideSection, hasSizeChoice } from "./size-guide";

describe("findSizeGuideSection", () => {
  it("matches belts and corsets to the waist table", () => {
    expect(findSizeGuideSection("کمربند طبی طب و صنعت")?.id).toBe("waist");
    expect(findSizeGuideSection("کرست کمر پاکسمن")?.id).toBe("waist");
  });

  it("prefers the ankle table over the wrist table for ankle braces", () => {
    expect(findSizeGuideSection("مچ‌بند پا نئوپرن")?.id).toBe("ankle");
    expect(findSizeGuideSection("مچ بند دست آتل‌دار")?.id).toBe("wrist");
  });

  it("ignores ZWNJ and Arabic letter variants", () => {
    expect(findSizeGuideSection("زانوبند كشی")?.id).toBe("knee");
    expect(findSizeGuideSection("گردن‌بند طبی نرم")?.id).toBe("neck");
  });

  it("returns null when nothing matches", () => {
    expect(findSizeGuideSection("گاز استریل")).toBeNull();
  });
});

describe("hasSizeChoice", () => {
  it("is false for single-size products", () => {
    expect(hasSizeChoice(["تک سایز"])).toBe(false);
    expect(hasSizeChoice([""])).toBe(false);
  });

  it("is true when any real size exists", () => {
    expect(hasSizeChoice(["S", "M", "L"])).toBe(true);
  });
});
