import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import WishlistPage from "./page";
import * as api from "@/lib/api";
import type { PublicWishlistItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    listWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    updateWishlistNote: vi.fn(),
  };
});

function buildItem(overrides: Partial<PublicWishlistItem> = {}): PublicWishlistItem {
  return {
    wishlistItemId: "w1",
    productId: "p1",
    productName: "کمربند طبی",
    productSlug: "lumbar-belt",
    brand: { name: "طب و صنعت", slug: "teb-o-sanat" },
    primaryImage: null,
    variantId: null,
    size: "M",
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    note: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ToastProvider>
      <WishlistProvider>
        <WishlistPage />
      </WishlistProvider>
    </ToastProvider>,
  );
}

describe("WishlistPage", () => {
  beforeEach(() => {
    vi.mocked(api.listWishlist).mockReset();
    vi.mocked(api.removeFromWishlist).mockReset();
    vi.mocked(api.updateWishlistNote).mockReset();
  });

  it("prompts login when the user is not authenticated", async () => {
    vi.mocked(api.listWishlist).mockRejectedValue(new api.ApiError(401, "no"));

    renderPage();

    expect(
      await screen.findByText("برای ذخیره علاقه‌مندی‌ها وارد حساب کاربری شوید."),
    ).toBeInTheDocument();
  });

  it("shows a distinct loading state before flashing empty or loaded content", async () => {
    let resolveList: (value: Awaited<ReturnType<typeof api.listWishlist>>) => void = () => {};
    vi.mocked(api.listWishlist).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    renderPage();

    // While the fetch is in flight: neither the empty state nor any item —
    // a light skeleton instead, so the two never get confused for a frame.
    expect(screen.queryByText("هنوز چیزی ذخیره نکرده‌اید")).not.toBeInTheDocument();
    expect(screen.queryByText("کمربند طبی")).not.toBeInTheDocument();

    resolveList({ items: [], total: 0, page: 1, limit: 100 });
    expect(await screen.findByText("هنوز چیزی ذخیره نکرده‌اید")).toBeInTheDocument();
  });

  it("shows the empty state when the wishlist has no items", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });

    renderPage();

    expect(await screen.findByText("هنوز چیزی ذخیره نکرده‌اید")).toBeInTheDocument();
  });

  it("lists items with product name, brand, size, and the null-safe price/stock copy", async () => {
    const item = buildItem();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 100 });

    renderPage();

    expect(await screen.findByText("کمربند طبی")).toBeInTheDocument();
    expect(screen.getByText("طب و صنعت")).toBeInTheDocument();
    expect(screen.getByText("سایز M")).toBeInTheDocument();
    expect(screen.getByText("قیمت پس از اتصال به سیستم فروش")).toBeInTheDocument();
    expect(screen.getByText("در حال همگام‌سازی موجودی")).toBeInTheDocument();
  });

  it("fetches the wishlist only once on mount — no duplicate request against the provider's own fetch", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({
      items: [buildItem()],
      total: 1,
      page: 1,
      limit: 100,
    });

    renderPage();
    await screen.findByText("کمربند طبی");

    expect(api.listWishlist).toHaveBeenCalledTimes(1);
  });

  it("removes an item from the list after a successful remove, and the header/product state stays in sync", async () => {
    const user = userEvent.setup();
    const item = buildItem();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 100 });
    vi.mocked(api.removeFromWishlist).mockResolvedValue(undefined);

    renderPage();
    await screen.findByText("کمربند طبی");

    await user.click(screen.getByRole("button", { name: "حذف کمربند طبی از علاقه‌مندی‌ها" }));

    await waitFor(() => expect(screen.queryByText("کمربند طبی")).not.toBeInTheDocument());
    expect(await screen.findByText("هنوز چیزی ذخیره نکرده‌اید")).toBeInTheDocument();
  });

  it("bounces back to the previous page when removing the last item leaves the current page empty", async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 21 }, (_, i) =>
      buildItem({ wishlistItemId: `w${i}`, productId: `p${i}`, productName: `محصول ${i}` }),
    );
    vi.mocked(api.listWishlist).mockResolvedValue({ items, total: 21, page: 1, limit: 100 });
    vi.mocked(api.removeFromWishlist).mockResolvedValue(undefined);

    renderPage();
    await screen.findByText("محصول 0");

    // Page 2 has exactly one item (the 21st). Pagination buttons render
    // Persian-Indic digits (toLocaleString("fa-IR")).
    await user.click(screen.getByRole("button", { name: "۲" }));
    await screen.findByText("محصول 20");

    await user.click(screen.getByRole("button", { name: "حذف محصول 20 از علاقه‌مندی‌ها" }));

    // Page 2 is now empty — land back on page 1 instead of showing nothing.
    await waitFor(() => expect(screen.getByText("محصول 0")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "۲" })).not.toBeInTheDocument();
  });

  it("saves a note edit without a page reload", async () => {
    const user = userEvent.setup();
    const item = buildItem();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 100 });
    vi.mocked(api.updateWishlistNote).mockResolvedValue({
      ...item,
      note: "برای مشورت با پزشک ذخیره کردم",
    });

    renderPage();
    await screen.findByText("کمربند طبی");

    await user.click(screen.getByRole("button", { name: "افزودن یادداشت" }));
    await user.type(
      screen.getByPlaceholderText("مثلاً: برای مشورت با پزشک ذخیره کردم..."),
      "برای مشورت با پزشک ذخیره کردم",
    );
    await user.click(screen.getByRole("button", { name: "ذخیره یادداشت" }));

    expect(await screen.findByText("برای مشورت با پزشک ذخیره کردم")).toBeInTheDocument();
    expect(api.listWishlist).toHaveBeenCalledTimes(1);
  });
});
