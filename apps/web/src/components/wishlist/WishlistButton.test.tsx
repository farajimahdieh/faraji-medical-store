import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "./WishlistProvider";
import { WishlistButton } from "./WishlistButton";
import * as api from "@/lib/api";
import type { PublicWishlistItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    listWishlist: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  };
});

function buildItem(overrides: Partial<PublicWishlistItem> = {}): PublicWishlistItem {
  return {
    wishlistItemId: "w1",
    productId: "p1",
    productName: "کمربند طبی",
    productSlug: "lumbar-belt",
    brand: null,
    primaryImage: null,
    variantId: null,
    size: null,
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    note: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderButton(status: "ready" | "anonymous" = "ready") {
  if (status === "anonymous") {
    vi.mocked(api.listWishlist).mockRejectedValue(new api.ApiError(401, "no"));
  } else {
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
  }

  return render(
    <ToastProvider>
      <WishlistProvider>
        <WishlistButton productId="p1" productName="کمربند طبی" />
      </WishlistProvider>
    </ToastProvider>,
  );
}

describe("WishlistButton", () => {
  beforeEach(() => {
    vi.mocked(api.listWishlist).mockReset();
    vi.mocked(api.addToWishlist).mockReset();
    vi.mocked(api.removeFromWishlist).mockReset();
  });

  it("renders outline (not pressed) when the product isn't saved", async () => {
    renderButton();
    const button = await screen.findByRole("button", { name: "افزودن کمربند طبی به علاقه‌مندی‌ها" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("fills and flips its label after a successful add", async () => {
    const user = userEvent.setup();
    vi.mocked(api.addToWishlist).mockResolvedValue(buildItem());
    renderButton();

    const button = await screen.findByRole("button", { name: "افزودن کمربند طبی به علاقه‌مندی‌ها" });
    await user.click(button);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "حذف کمربند طبی از علاقه‌مندی‌ها" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("prompts an anonymous user to log in instead of calling the API", async () => {
    const user = userEvent.setup();
    renderButton("anonymous");

    const button = await screen.findByRole("button", { name: "افزودن کمربند طبی به علاقه‌مندی‌ها" });
    await user.click(button);

    expect(
      await screen.findByText("برای ذخیره علاقه‌مندی‌ها وارد حساب کاربری شوید."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ورود به حساب" })).toHaveAttribute("href", "/login");
    expect(api.addToWishlist).not.toHaveBeenCalled();
  });

  it("disables itself while a request is in flight so a double click can't fire twice", async () => {
    const user = userEvent.setup();
    let resolveAdd: (item: PublicWishlistItem) => void = () => {};
    vi.mocked(api.addToWishlist).mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );
    renderButton();

    const button = await screen.findByRole("button", { name: "افزودن کمربند طبی به علاقه‌مندی‌ها" });
    await user.click(button);

    expect(button).toBeDisabled();
    resolveAdd(buildItem());
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(api.addToWishlist).toHaveBeenCalledTimes(1);
  });
});
