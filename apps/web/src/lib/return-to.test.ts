import { describe, expect, it } from "vitest";
import { currentPathWithQuery, getSafeReturnTo, loginHrefWithReturnTo } from "./return-to";

describe("getSafeReturnTo", () => {
  it("accepts an internal path", () => {
    expect(getSafeReturnTo("/products/lumbar-belt")).toBe("/products/lumbar-belt");
  });

  it("accepts an internal path with a query string", () => {
    expect(getSafeReturnTo("/categories/orthopedic-rehabilitation?q=زانوبند&size=L")).toBe(
      "/categories/orthopedic-rehabilitation?q=زانوبند&size=L",
    );
  });

  it("falls back to /account when nothing is given", () => {
    expect(getSafeReturnTo(null)).toBe("/account");
    expect(getSafeReturnTo(undefined)).toBe("/account");
    expect(getSafeReturnTo("")).toBe("/account");
  });

  it("rejects an absolute external URL", () => {
    expect(getSafeReturnTo("https://example.com")).toBe("/account");
  });

  it("rejects a protocol-relative URL", () => {
    expect(getSafeReturnTo("//example.com")).toBe("/account");
  });

  it("rejects a backslash-prefixed path (browser-normalized to protocol-relative)", () => {
    expect(getSafeReturnTo("/\\example.com")).toBe("/account");
  });

  it("rejects a value containing an embedded scheme", () => {
    expect(getSafeReturnTo("/redirect?next=https://example.com")).toBe("/account");
  });
});

describe("currentPathWithQuery / loginHrefWithReturnTo", () => {
  it("combines pathname and search params", () => {
    const search = new URLSearchParams({ q: "زانوبند", size: "L" });
    expect(currentPathWithQuery("/categories/orthopedic-rehabilitation", search)).toBe(
      "/categories/orthopedic-rehabilitation?q=%D8%B2%D8%A7%D9%86%D9%88%D8%A8%D9%86%D8%AF&size=L",
    );
  });

  it("returns the bare pathname when there is no query", () => {
    expect(currentPathWithQuery("/wishlist", new URLSearchParams())).toBe("/wishlist");
  });

  it("builds an encoded login href", () => {
    expect(loginHrefWithReturnTo("/products/example")).toBe(
      "/login?returnTo=%2Fproducts%2Fexample",
    );
  });
});
