import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RecentlyViewedSection } from "./RecentlyViewedSection";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import * as api from "@/lib/api";
import type { PublicProductDetail, PublicProductListItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    getMe: vi.fn(),
    recordRecentlyViewed: vi.fn(),
    listRecentlyViewed: vi.fn(),
    listWishlist: vi.fn(),
  };
});

function buildProductDetail(overrides?: Partial<PublicProductDetail>): PublicProductDetail {
  return {
    id: "current-product",
    slug: "current-product",
    name: "کمربند طبی",
    brand: null,
    category: null,
    shortDescription: null,
    description: null,
    features: [],
    images: [{ url: "/current.webp", altText: null, isPrimary: true }],
    variants: [{ id: "v1", size: "M", price: 100000, stock: 5, isActive: true }],
    sourceCode: null,
    videoUrl: null,
    videoSource: null,
    videoTitle: null,
    ...overrides,
  };
}

function buildListItem(overrides?: Partial<PublicProductListItem>): PublicProductListItem {
  return {
    id: "other-product",
    slug: "other-product",
    name: "زانوبند طبی",
    brand: null,
    primaryImage: null,
    sizes: ["M"],
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    ...overrides,
  };
}

function renderSection(product: PublicProductDetail) {
  return render(
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <RecentlyViewedSection product={product} />
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>,
  );
}

describe("RecentlyViewedSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.recordRecentlyViewed).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.listRecentlyViewed).mockReset();
    vi.mocked(api.listWishlist).mockReset().mockRejectedValue(new api.ApiError(401, "no session"));
  });

  it("guest: stays hidden when fewer than 2 other products have been viewed", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new api.ApiError(401, "no session"));
    const product = buildProductDetail();

    renderSection(product);

    await waitFor(() => expect(localStorage.getItem("faraji:recently-viewed")).not.toBeNull());
    expect(screen.queryByText("محصولات اخیراً دیده‌شده")).not.toBeInTheDocument();
  });

  it("guest: renders previously viewed products, excluding the current one", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new api.ApiError(401, "no session"));
    const previouslyViewed = [
      { ...buildListItem({ id: "p1", name: "زانوبند" }), viewedAt: new Date().toISOString() },
      { ...buildListItem({ id: "p2", name: "آتل ساق" }), viewedAt: new Date().toISOString() },
    ];
    localStorage.setItem("faraji:recently-viewed", JSON.stringify(previouslyViewed));
    const product = buildProductDetail();

    renderSection(product);

    expect(await screen.findByText("محصولات اخیراً دیده‌شده")).toBeInTheDocument();
    expect(screen.getAllByText("زانوبند")).not.toHaveLength(0);
    expect(screen.getAllByText("آتل ساق")).not.toHaveLength(0);
    expect(screen.queryByText("کمربند طبی")).not.toBeInTheDocument();
  });

  it("authenticated: records the view on the backend and renders the backend list, excluding the current product", async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      user: {
        id: "u1",
        phone: "+989121110001",
        firstName: null,
        lastName: null,
        birthDate: null,
        role: "customer",
      },
    });
    vi.mocked(api.listRecentlyViewed).mockResolvedValue([
      { ...buildListItem({ id: "p1", name: "زانوبند" }), viewedAt: new Date().toISOString() },
      { ...buildListItem({ id: "p2", name: "آتل ساق" }), viewedAt: new Date().toISOString() },
      {
        ...buildListItem({ id: "current-product", name: "کمربند طبی" }),
        viewedAt: new Date().toISOString(),
      },
    ]);
    const product = buildProductDetail();

    renderSection(product);

    await waitFor(() =>
      expect(api.recordRecentlyViewed).toHaveBeenCalledWith("current-product"),
    );
    expect(await screen.findByText("محصولات اخیراً دیده‌شده")).toBeInTheDocument();
    expect(screen.getAllByText("زانوبند")).not.toHaveLength(0);
    expect(screen.getAllByText("آتل ساق")).not.toHaveLength(0);
    expect(screen.queryByText("کمربند طبی")).not.toBeInTheDocument();
  });
});
