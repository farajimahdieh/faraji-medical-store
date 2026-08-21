import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia — default to "no" for every query
// (e.g. hover-capability checks) unless a test overrides it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
