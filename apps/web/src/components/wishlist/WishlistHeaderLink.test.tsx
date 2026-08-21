import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "./WishlistProvider";
import { WishlistHeaderLink } from "./WishlistHeaderLink";
import * as api from "@/lib/api";
import type { PublicWishlistItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, listWishlist: vi.fn() };
});

// vitest.setup.ts stubs matchMedia to always report "no" (not hover
// capable) — this overrides it per test for the desktop/hover scenarios.
function mockHoverCapable(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function buildItem(): PublicWishlistItem {
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
  };
}

function renderLink() {
  return render(
    <ToastProvider>
      <WishlistProvider>
        <WishlistHeaderLink />
      </WishlistProvider>
    </ToastProvider>,
  );
}

describe("WishlistHeaderLink", () => {
  beforeEach(() => {
    vi.mocked(api.listWishlist).mockReset();
    mockHoverCapable(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides the badge when the wishlist is empty", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();

    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the real count from the backend (GET /wishlist's own total), not a guess", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({
      items: [buildItem()],
      total: 3,
      page: 1,
      limit: 100,
    });
    renderLink();

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("does not render the popover until hovered", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();

    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());
    expect(screen.queryByText("برای بعد نگهش دار")).not.toBeInTheDocument();
  });

  it("never opens on hover for a touch-only device (no real pointer) — a tap just navigates", async () => {
    mockHoverCapable(false);
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();
    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());

    await user.hover(screen.getByRole("link", { name: "علاقه‌مندی‌ها" }));

    expect(screen.queryByText("برای بعد نگهش دار")).not.toBeInTheDocument();
  });

  it("shows the empty explanation on hover when there are no items", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();

    await user.hover(screen.getByRole("link", { name: "علاقه‌مندی‌ها" }));

    expect(await screen.findByText("برای بعد نگهش دار")).toBeInTheDocument();
    expect(screen.getByText("هنوز محصولی ذخیره نکرده‌اید")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "مشاهده علاقه‌مندی‌ها" })).not.toBeInTheDocument();
  });

  it("shows a 'view wishlist' CTA and the count on hover when there are items", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({
      items: [buildItem()],
      total: 1,
      page: 1,
      limit: 100,
    });
    renderLink();
    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());

    await user.hover(screen.getByRole("link", { name: "علاقه‌مندی‌ها" }));

    const cta = await screen.findByRole("link", { name: "مشاهده علاقه‌مندی‌ها" });
    expect(cta).toHaveAttribute("href", "/wishlist");
    expect(screen.getByText("۱ محصول ذخیره‌شده")).toBeInTheDocument();
  });

  it("opens on keyboard focus, not just mouse hover", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();
    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());

    await user.tab();
    expect(screen.getByRole("link", { name: "علاقه‌مندی‌ها" })).toHaveFocus();
    expect(await screen.findByText("برای بعد نگهش دار")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the heart link", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    renderLink();
    await waitFor(() => expect(api.listWishlist).toHaveBeenCalled());

    const link = screen.getByRole("link", { name: "علاقه‌مندی‌ها" });
    link.focus();
    await screen.findByText("برای بعد نگهش دار");

    await user.keyboard("{Escape}");

    expect(screen.queryByText("برای بعد نگهش دار")).not.toBeInTheDocument();
    expect(link).toHaveFocus();
  });
});
