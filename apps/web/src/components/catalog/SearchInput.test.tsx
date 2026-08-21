import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

const mockReplace = vi.fn();
let mockPathname = "/categories/orthopedic-mobility-rehab";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("SearchInput (category listing search)", () => {
  beforeEach(() => {
    mockPathname = "/categories/orthopedic-mobility-rehab";
    mockSearchParams = new URLSearchParams();
    mockReplace.mockClear();
  });

  it("uses a plain text input, not a native search input", () => {
    render(<SearchInput placeholder="جستجو..." />);
    expect(screen.getByPlaceholderText("جستجو...")).toHaveAttribute("type", "text");
  });

  it("shows exactly one clear button once there is a query", async () => {
    const user = userEvent.setup();
    render(<SearchInput placeholder="جستجو..." />);
    const input = screen.getByPlaceholderText("جستجو...");

    expect(
      screen.queryByRole("button", { name: "پاک کردن جستجو" }),
    ).not.toBeInTheDocument();

    await user.type(input, "کمربند");
    expect(
      screen.getAllByRole("button", { name: "پاک کردن جستجو" }),
    ).toHaveLength(1);
  });

  it("initializes only from this page's own ?q=, not some other page's", () => {
    mockSearchParams = new URLSearchParams({ q: "زانوبند" });
    render(<SearchInput placeholder="جستجو..." />);
    expect(screen.getByPlaceholderText("جستجو...")).toHaveValue("زانوبند");
  });

  it("resyncs when the URL's ?q= changes across a navigation (e.g. a different category)", () => {
    mockSearchParams = new URLSearchParams({ q: "کمربند" });
    const { rerender } = render(<SearchInput placeholder="جستجو..." />);
    expect(screen.getByPlaceholderText("جستجو...")).toHaveValue("کمربند");

    mockSearchParams = new URLSearchParams(); // new category page, no q
    rerender(<SearchInput placeholder="جستجو..." />);
    expect(screen.getByPlaceholderText("جستجو...")).toHaveValue("");
  });
});
