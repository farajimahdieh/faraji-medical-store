import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider, useWishlist } from "./WishlistProvider";
import * as api from "@/lib/api";
import type { PublicWishlistItem, PublicWishlistListResponse } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    listWishlist: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  };
});

function emptyList(): PublicWishlistListResponse {
  return { items: [], total: 0, page: 1, limit: 100 };
}

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

function TestConsumer({ productId }: { productId: string }) {
  const { status, count, itemsComplete, isSaved, toggle } = useWishlist();
  return (
    <div>
      <span data-testid={`status-${productId}`}>{status}</span>
      <span data-testid="count">{count}</span>
      <span data-testid="complete">{itemsComplete ? "yes" : "no"}</span>
      <span data-testid={`saved-${productId}`}>{isSaved(productId) ? "yes" : "no"}</span>
      <button onClick={() => toggle({ productId })}>toggle-{productId}</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <ToastProvider>
      <WishlistProvider>{ui}</WishlistProvider>
    </ToastProvider>,
  );
}

describe("WishlistProvider", () => {
  beforeEach(() => {
    vi.mocked(api.listWishlist).mockReset();
    vi.mocked(api.addToWishlist).mockReset();
    vi.mocked(api.removeFromWishlist).mockReset();
  });

  it("becomes anonymous when the wishlist fetch is unauthorized", async () => {
    vi.mocked(api.listWishlist).mockRejectedValue(new api.ApiError(401, "unauthorized"));

    renderWithProviders(<TestConsumer productId="p1" />);

    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("anonymous"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("derives count from GET /wishlist's own total — no separate count request", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({
      ...emptyList(),
      items: [buildItem()],
      total: 1,
    });

    renderWithProviders(<TestConsumer productId="p1" />);

    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("complete")).toHaveTextContent("yes");
  });

  it("fetches the wishlist exactly once no matter how many components use it (no N+1)", async () => {
    vi.mocked(api.listWishlist).mockResolvedValue({
      ...emptyList(),
      items: [buildItem()],
      total: 1,
    });

    renderWithProviders(
      <>
        <TestConsumer productId="p1" />
        <TestConsumer productId="p2" />
        <TestConsumer productId="p3" />
      </>,
    );

    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));
    expect(api.listWishlist).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes");
    expect(screen.getByTestId("saved-p2")).toHaveTextContent("no");
  });

  it("adds optimistically, shows a success toast, and updates count for every consumer", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue(emptyList());
    vi.mocked(api.addToWishlist).mockResolvedValue(buildItem());

    renderWithProviders(
      <>
        <TestConsumer productId="p1" />
        <TestConsumer productId="p2" />
      </>,
    );
    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));

    await user.click(screen.getByText("toggle-p1"));

    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));
    for (const el of screen.getAllByTestId("count")) {
      expect(el).toHaveTextContent("1");
    }
    expect(screen.getByTestId("saved-p2")).toHaveTextContent("no");
    expect(
      await screen.findByText("این کالا به علاقه‌مندی‌های شما اضافه شد"),
    ).toBeInTheDocument();
  });

  it("removes on a second toggle and shows a removal toast", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({
      ...emptyList(),
      items: [buildItem()],
      total: 1,
    });
    vi.mocked(api.removeFromWishlist).mockResolvedValue(undefined);

    renderWithProviders(<TestConsumer productId="p1" />);
    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));

    await user.click(screen.getByText("toggle-p1"));

    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("no"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(
      await screen.findByText("این کالا از علاقه‌مندی‌های شما حذف شد"),
    ).toBeInTheDocument();
  });

  it("rolls back state and shows an error toast when add fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue(emptyList());
    vi.mocked(api.addToWishlist).mockRejectedValue(new Error("network down"));

    renderWithProviders(<TestConsumer productId="p1" />);
    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));

    await user.click(screen.getByText("toggle-p1"));

    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("no"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(
      await screen.findByText("عملیات انجام نشد، دوباره تلاش کنید"),
    ).toBeInTheDocument();
  });

  it("rolls back state and shows an error toast when remove fails (item is not lost)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue({
      ...emptyList(),
      items: [buildItem()],
      total: 1,
    });
    vi.mocked(api.removeFromWishlist).mockRejectedValue(new Error("network down"));

    renderWithProviders(<TestConsumer productId="p1" />);
    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));

    await user.click(screen.getByText("toggle-p1"));

    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(
      await screen.findByText("عملیات انجام نشد، دوباره تلاش کنید"),
    ).toBeInTheDocument();
  });

  it("ignores a second toggle on the same item while the first is still in flight (rapid clicks)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue(emptyList());
    let resolveAdd: (item: PublicWishlistItem) => void = () => {};
    vi.mocked(api.addToWishlist).mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );

    renderWithProviders(<TestConsumer productId="p1" />);
    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));

    await user.click(screen.getByText("toggle-p1"));
    await user.click(screen.getByText("toggle-p1"));
    await user.click(screen.getByText("toggle-p1"));
    resolveAdd(buildItem());

    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));
    expect(api.addToWishlist).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("keeps a single toast on screen even if multiple actions fire back to back", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listWishlist).mockResolvedValue(emptyList());
    vi.mocked(api.addToWishlist).mockResolvedValue(buildItem());
    vi.mocked(api.removeFromWishlist).mockResolvedValue(undefined);

    renderWithProviders(<TestConsumer productId="p1" />);
    await waitFor(() => expect(screen.getByTestId("status-p1")).toHaveTextContent("ready"));

    await user.click(screen.getByText("toggle-p1"));
    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("yes"));
    await user.click(screen.getByText("toggle-p1"));
    await waitFor(() => expect(screen.getByTestId("saved-p1")).toHaveTextContent("no"));

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(
      await screen.findByText("این کالا از علاقه‌مندی‌های شما حذف شد"),
    ).toBeInTheDocument();
  });
});
