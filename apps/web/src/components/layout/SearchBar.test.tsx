import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";
import { SearchInput } from "@/components/catalog/SearchInput";
import * as api from "@/lib/api";

const mockPush = vi.fn();
let mockPathname = "/";
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    getProductSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
  };
});

describe("SearchBar", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockPush.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("uses a plain text input, not a native search input", () => {
    render(<SearchBar />);
    const input = screen.getByRole("combobox", { name: "جستجو در محصولات" });
    expect(input).toHaveAttribute("type", "text");
  });

  it("shows exactly one clear button once there is a query, and none when empty", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("combobox", { name: "جستجو در محصولات" });

    expect(
      screen.queryByRole("button", { name: "پاک کردن جستجو" }),
    ).not.toBeInTheDocument();

    await user.type(input, "گردنبند");
    expect(
      screen.getAllByRole("button", { name: "پاک کردن جستجو" }),
    ).toHaveLength(1);
  });

  it("clears its own query, without touching a sibling SearchInput's value", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar />
        <SearchInput placeholder="جستجو در محصولات ارتوپدی..." />
      </div>,
    );

    const headerInput = screen.getByRole("combobox", { name: "جستجو در محصولات" });
    const categoryInput = screen.getByPlaceholderText("جستجو در محصولات ارتوپدی...");

    await user.type(headerInput, "گردنبند");
    await user.type(categoryInput, "کمربند");
    expect(headerInput).toHaveValue("گردنبند");
    expect(categoryInput).toHaveValue("کمربند");

    // Both search bars now render their own clear button (one each) — scope
    // to the header's own <form> to click specifically its clear button.
    const headerForm = headerInput.closest("form");
    if (!headerForm) throw new Error("header form not found");
    await user.click(within(headerForm).getByRole("button", { name: "پاک کردن جستجو" }));
    expect(headerInput).toHaveValue("");
    expect(categoryInput).toHaveValue("کمربند"); // untouched
  });

  it("Header and Category search bars stay independent while typing", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar />
        <SearchInput placeholder="جستجو در محصولات ارتوپدی..." />
      </div>,
    );

    const headerInput = screen.getByRole("combobox", { name: "جستجو در محصولات" });
    const categoryInput = screen.getByPlaceholderText("جستجو در محصولات ارتوپدی...");

    await user.type(headerInput, "گردنبند");
    expect(categoryInput).toHaveValue("");

    await user.clear(headerInput);
    await user.type(categoryInput, "طب و صنعت");
    expect(headerInput).toHaveValue("");
    expect(categoryInput).toHaveValue("طب و صنعت");
  });

  it("resets its query when the route changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SearchBar />);
    const input = screen.getByRole("combobox", { name: "جستجو در محصولات" });

    await user.type(input, "گردنبند");
    expect(input).toHaveValue("گردنبند");

    mockPathname = "/categories/orthopedic-mobility-rehab";
    rerender(<SearchBar />);

    expect(screen.getByRole("combobox", { name: "جستجو در محصولات" })).toHaveValue("");
  });

  it("closes any open dropdown when the route changes", async () => {
    const user = userEvent.setup();
    localStorage.setItem("faraji:search-history", JSON.stringify(["زانوبند"]));
    const { rerender } = render(<SearchBar />);
    const input = screen.getByRole("combobox", { name: "جستجو در محصولات" });

    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    mockPathname = "/products";
    rerender(<SearchBar />);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps search history across a route change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SearchBar />);
    const input = screen.getByRole("combobox", { name: "جستجو در محصولات" });

    await user.type(input, "زانوبند");
    await user.keyboard("{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/products?q=%D8%B2%D8%A7%D9%86%D9%88%D8%A8%D9%86%D8%AF");

    // Simulate the navigation this Enter press triggered.
    mockPathname = "/products";
    rerender(<SearchBar />);

    expect(JSON.parse(localStorage.getItem("faraji:search-history") ?? "[]")).toEqual([
      "زانوبند",
    ]);

    // Recent Searches should still show it after the route change. The
    // input never actually lost focus in this test (nothing blurred it),
    // so explicitly move focus away and back to get a real focus event —
    // in a real browser, navigating away always does this implicitly.
    const inputAfterNav = screen.getByRole("combobox", { name: "جستجو در محصولات" });
    inputAfterNav.blur();
    await user.click(inputAfterNav);
    const listbox = screen.getByRole("listbox", { name: "جستجوهای اخیر" });
    expect(within(listbox).getByText("زانوبند")).toBeInTheDocument();
  });
});
