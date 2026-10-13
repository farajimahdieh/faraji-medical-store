import { describe, expect, it } from "vitest";
import { findSizeGuideSection, hasSizeChoice, sizeGuideSections } from "./size-guide";

describe("findSizeGuideSection", () => {
  it("matches belts and corsets to the waist table", () => {
    expect(findSizeGuideSection("کمربند طبی طب و صنعت")?.id).toBe("waist");
    expect(findSizeGuideSection("کرست کمر پاکسمن")?.id).toBe("waist");
    expect(findSizeGuideSection("گرمکن کلیه دولایه طب و صنعت")?.id).toBe("waist");
  });

  it("shows no table for shapewear, which Teb-o-Sanat has no table for", () => {
    expect(findSizeGuideSection("گن شکم بند آرتان (Artan)")).toBeNull();
    expect(findSizeGuideSection("گن شلوارکی مردانه پاک سمن")).toBeNull();
  });

  it("uses the model's own table where Teb-o-Sanat has one", () => {
    expect(findSizeGuideSection("شکم بند بارداری طب و صنعت")?.id).toBe("maternity-belt");
    expect(findSizeGuideSection("گردنبند طبی سخت چانه‌دار پاک سمن")?.id).toBe("neck-hard");
    expect(findSizeGuideSection("گردنبند طبی نیمه سخت")?.id).toBe("neck-semi-rigid");
    expect(findSizeGuideSection("زانوبند کشی لی روی")?.id).toBe("knee-elastic");
    expect(findSizeGuideSection("زانوبند نئوپرن چهار فنره پاک سمن")?.id).toBe("knee");
    expect(findSizeGuideSection("کفش گچ مدل رِها")?.id).toBe("cast-shoe-reha");
  });

  it("prefers the ankle table over the wrist table for ankle braces", () => {
    expect(findSizeGuideSection("مچ‌بند پا نئوپرن")?.id).toBe("ankle");
    expect(findSizeGuideSection("مچ بند دست آتل‌دار")?.id).toBe("wrist");
    expect(findSizeGuideSection("مچ بند آتل دار نئوپرن با آتل شست")?.id).toBe("wrist");
    expect(findSizeGuideSection("اُرتوز شست نئوپرن")?.id).toBe("thumb");
  });

  it("treats below-knee stockings as stockings, not knee braces", () => {
    expect(findSizeGuideSection("جوراب واریس زیر زانو واریمد")?.id).toBe("stockings");
    expect(findSizeGuideSection("جوراب ضد آمبولی دوکاواس")?.id).toBe("anti-embolism-stockings");
  });

  it("ignores ZWNJ and Arabic letter variants", () => {
    expect(findSizeGuideSection("زانوبند نئوپرن ساده كشکک باز")?.id).toBe("knee");
    expect(findSizeGuideSection("گردن‌بند طبی نرم")?.id).toBe("neck");
  });

  it("returns null when nothing matches", () => {
    expect(findSizeGuideSection("گاز استریل")).toBeNull();
    expect(findSizeGuideSection("وزنه مچ پا")).toBeNull();
  });
});

describe("sizeGuideSections", () => {
  it("has unique ids and one value per column in every row", () => {
    const ids = sizeGuideSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of sizeGuideSections) {
      for (const row of section.rows) {
        expect(row.values).toHaveLength(section.columns.length);
      }
    }
  });
});

describe("hasSizeChoice", () => {
  it("is false for single-size products", () => {
    expect(hasSizeChoice(["تک سایز"])).toBe(false);
    expect(hasSizeChoice([""])).toBe(false);
    expect(hasSizeChoice(["استاندارد"])).toBe(false);
  });

  it("is false for left/right variants", () => {
    expect(hasSizeChoice(["راست", "چپ"])).toBe(false);
  });

  it("is true when any real size exists", () => {
    expect(hasSizeChoice(["S", "M", "L"])).toBe(true);
  });
});
