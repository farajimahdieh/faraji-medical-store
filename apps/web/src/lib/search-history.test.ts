import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from "./search-history";

describe("search history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(getSearchHistory()).toEqual([]);
  });

  it("adds a term to the front", () => {
    addSearchHistory("زانوبند");
    addSearchHistory("کمربند طبی");
    expect(getSearchHistory()).toEqual(["کمربند طبی", "زانوبند"]);
  });

  it("moves an existing duplicate to the front instead of storing it twice", () => {
    addSearchHistory("زانوبند");
    addSearchHistory("کمربند");
    addSearchHistory("گردنبند");
    addSearchHistory("کمربند");
    expect(getSearchHistory()).toEqual(["کمربند", "گردنبند", "زانوبند"]);
  });

  it("ignores an empty/whitespace-only term", () => {
    addSearchHistory("زانوبند");
    addSearchHistory("   ");
    expect(getSearchHistory()).toEqual(["زانوبند"]);
  });

  it("caps stored history at 10 entries", () => {
    for (let i = 0; i < 12; i++) addSearchHistory(`term-${i}`);
    const history = getSearchHistory();
    expect(history).toHaveLength(10);
    expect(history[0]).toBe("term-11");
    expect(history).not.toContain("term-0");
    expect(history).not.toContain("term-1");
  });

  it("removes a single entry", () => {
    addSearchHistory("زانوبند");
    addSearchHistory("کمربند");
    const next = removeSearchHistoryItem("زانوبند");
    expect(next).toEqual(["کمربند"]);
    expect(getSearchHistory()).toEqual(["کمربند"]);
  });

  it("clears all history", () => {
    addSearchHistory("زانوبند");
    addSearchHistory("کمربند");
    const next = clearSearchHistory();
    expect(next).toEqual([]);
    expect(getSearchHistory()).toEqual([]);
  });

  afterEach(() => {
    localStorage.clear();
  });
});
