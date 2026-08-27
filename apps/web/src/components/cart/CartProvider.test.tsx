import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CartProvider, useCart } from "./CartProvider";
import * as api from "@/lib/api";
import type { PublicCart, PublicCartItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    getCart: vi.fn(),
    addCartItem: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
  };
});

function buildItem(overrides: Partial<PublicCartItem> = {}): PublicCartItem {
  return {
    id: "item-1",
    productId: "p1",
    productName: "گان جراحی",
    productSlug: "gan-jarahi",
    brand: null,
    primaryImage: null,
    variantId: "variant-1",
    size: "L",
    quantity: 1,
    unitPrice: 100_000,
    lineTotal: 100_000,
    stockStatus: "in_stock",
    maxQuantity: 5,
    unavailable: false,
    unavailableReason: null,
    ...overrides,
  };
}

function buildCart(overrides: Partial<PublicCart> = {}): PublicCart {
  return {
    items: [],
    summary: { subtotal: 0, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 0, itemCount: 0 },
    coupon: null,
    couponError: null,
    ...overrides,
  };
}

function TestConsumer() {
  const { status, count, items, coupon, addItem, removeItem, applyCoupon } = useCart();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="count">{count}</span>
      <span data-testid="items">{items.length}</span>
      <span data-testid="coupon">{coupon?.code ?? "none"}</span>
      <button onClick={() => addItem("variant-1")}>add</button>
      <button onClick={() => items[0] && removeItem(items[0].id)}>remove</button>
      <button onClick={() => applyCoupon("SAVE10")}>apply-coupon</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <ToastProvider>
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    </ToastProvider>,
  );
}

describe("CartProvider", () => {
  beforeEach(() => {
    vi.mocked(api.getCart).mockReset();
    vi.mocked(api.addCartItem).mockReset();
    vi.mocked(api.updateCartItem).mockReset();
    vi.mocked(api.removeCartItem).mockReset();
    vi.mocked(api.clearCart).mockReset();
    vi.mocked(api.applyCoupon).mockReset();
    vi.mocked(api.removeCoupon).mockReset();
  });

  it("becomes anonymous when the cart fetch is unauthorized", async () => {
    vi.mocked(api.getCart).mockRejectedValue(new api.ApiError(401, "unauthorized"));
    renderWithProviders();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("loads the item count and items from GET /cart", async () => {
    vi.mocked(api.getCart).mockResolvedValue(
      buildCart({ items: [buildItem()], summary: { subtotal: 100_000, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 100_000, itemCount: 1 } }),
    );
    renderWithProviders();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("items")).toHaveTextContent("1");
  });

  it("adds an item and shows a success toast", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getCart).mockResolvedValue(buildCart());
    vi.mocked(api.addCartItem).mockResolvedValue(
      buildCart({ items: [buildItem()], summary: { subtotal: 100_000, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 100_000, itemCount: 1 } }),
    );
    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));

    await user.click(screen.getByText("add"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    expect(await screen.findByText("محصول به سبد خرید اضافه شد")).toBeInTheDocument();
  });

  it("shows an error toast (e.g. out of stock) instead of updating the cart when add fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getCart).mockResolvedValue(buildCart());
    vi.mocked(api.addCartItem).mockRejectedValue(new api.ApiError(400, "موجودی کافی نیست (۲ عدد موجود است)"));
    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));

    await user.click(screen.getByText("add"));

    expect(await screen.findByText("موجودی کافی نیست (۲ عدد موجود است)")).toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("removes an item and shows an info toast", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getCart).mockResolvedValue(
      buildCart({ items: [buildItem()], summary: { subtotal: 100_000, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 100_000, itemCount: 1 } }),
    );
    vi.mocked(api.removeCartItem).mockResolvedValue(buildCart());
    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("items")).toHaveTextContent("1"));

    await user.click(screen.getByText("remove"));

    await waitFor(() => expect(screen.getByTestId("items")).toHaveTextContent("0"));
    expect(await screen.findByText("کالا از سبد خرید حذف شد")).toBeInTheDocument();
  });

  it("applies a coupon successfully and stores it", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getCart).mockResolvedValue(buildCart());
    vi.mocked(api.applyCoupon).mockResolvedValue(
      buildCart({ coupon: { code: "SAVE10", type: "percentage", value: 10 } }),
    );
    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));

    await user.click(screen.getByText("apply-coupon"));

    await waitFor(() => expect(screen.getByTestId("coupon")).toHaveTextContent("SAVE10"));
    expect(await screen.findByText("کد تخفیف اعمال شد")).toBeInTheDocument();
  });

  it("shows the backend's rejection message for an invalid coupon", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getCart).mockResolvedValue(buildCart());
    vi.mocked(api.applyCoupon).mockRejectedValue(new api.ApiError(400, "این کد تخفیف منقضی شده است"));
    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));

    await user.click(screen.getByText("apply-coupon"));

    expect(await screen.findByText("این کد تخفیف منقضی شده است")).toBeInTheDocument();
    expect(screen.getByTestId("coupon")).toHaveTextContent("none");
  });
});
