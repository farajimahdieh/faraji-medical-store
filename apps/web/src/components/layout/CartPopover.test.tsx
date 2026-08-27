import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartPopover } from "./CartPopover";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import * as api from "@/lib/api";
import type { PublicCart } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, getCart: vi.fn() };
});

function renderPopover() {
  return render(
    <ToastProvider>
      <CartProvider>
        <CartPopover />
      </CartProvider>
    </ToastProvider>,
  );
}

function buildCart(overrides?: Partial<PublicCart>): PublicCart {
  return {
    items: [],
    summary: { subtotal: 0, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 0, itemCount: 0 },
    coupon: null,
    couponError: null,
    ...overrides,
  };
}

describe("CartPopover", () => {
  it("shows the empty state for an anonymous visitor -- no fake items or count", async () => {
    vi.mocked(api.getCart).mockRejectedValue(new api.ApiError(401, "no session"));
    renderPopover();

    const trigger = await screen.findByRole("link", { name: "سبد خرید" });
    fireEvent.focus(trigger);

    expect(await screen.findByText("سبد خرید شما")).toBeInTheDocument();
    expect(
      screen.getByText("محصولاتی که برای خرید انتخاب می‌کنید اینجا نگه داشته می‌شوند."),
    ).toBeInTheDocument();
    expect(trigger.querySelector("span")).not.toBeInTheDocument();
  });

  it("shows the real item count badge and lets the shopper reach the cart page", async () => {
    vi.mocked(api.getCart).mockResolvedValue(
      buildCart({
        items: [
          {
            id: "item-1",
            productId: "product-1",
            productName: "گان جراحی",
            productSlug: "gan-jarahi",
            brand: null,
            primaryImage: null,
            variantId: "variant-1",
            size: "L",
            quantity: 2,
            unitPrice: 100_000,
            lineTotal: 200_000,
            stockStatus: "in_stock",
            maxQuantity: 5,
            unavailable: false,
            unavailableReason: null,
          },
        ],
        summary: {
          subtotal: 200_000,
          discountAmount: 0,
          shippingAmount: 0,
          taxAmount: 0,
          totalAmount: 200_000,
          itemCount: 2,
        },
      }),
    );

    renderPopover();

    const trigger = await screen.findByRole("link", { name: "سبد خرید" });
    expect(await screen.findByText("۲")).toBeInTheDocument();

    fireEvent.focus(trigger);
    expect(await screen.findByText("مشاهده سبد خرید")).toBeInTheDocument();
  });
});
