import { describe, expect, it } from "vitest";
import { highlightMatch } from "./highlight-match";

describe("highlightMatch", () => {
  it("marks the matching prefix", () => {
    expect(highlightMatch("گردنبند طبی سخت", "گرد")).toEqual([
      { text: "گرد", match: true },
      { text: "نبند طبی سخت", match: false },
    ]);
  });

  it("marks a mid-string match", () => {
    expect(highlightMatch("کتف بند و قوزبند", "قوز")).toEqual([
      { text: "کتف بند و ", match: false },
      { text: "قوز", match: true },
      { text: "بند", match: false },
    ]);
  });

  it("matches across ی/ي and ک/ك variants", () => {
    // Query uses Arabic-script kaf (ك); label uses Persian kaf (ک).
    expect(highlightMatch("کمربند کار", "كمربند")).toEqual([
      { text: "کمربند", match: true },
      { text: " کار", match: false },
    ]);
  });

  it("matches across a half-space (ZWNJ) vs. plain space", () => {
    expect(highlightMatch("گردن‌بند طبی", "گردن بند")).toEqual([
      { text: "گردن‌بند", match: true },
      { text: " طبی", match: false },
    ]);
  });

  it("returns the whole text unmatched when there's no match", () => {
    expect(highlightMatch("زانوبند کشی", "کمر")).toEqual([
      { text: "زانوبند کشی", match: false },
    ]);
  });

  it("returns the whole text unmatched for an empty query", () => {
    expect(highlightMatch("زانوبند کشی", "  ")).toEqual([
      { text: "زانوبند کشی", match: false },
    ]);
  });
});
