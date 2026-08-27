import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CartProvider } from "./CartProvider";
import { AddToCartButton } from "./AddToCartButton";
import * as api from "@/lib/api";
import type { PublicCart, PublicProductVariant } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products/gan-jarahi",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, getCart: vi.fn(), addCartItem: vi.fn() };
});

function emptyCart(): PublicCart {
  return {
    items: [],
    summary: { subtotal: 0, discountAmount: 0, shippingAmount: 0, taxAmount: 0, totalAmount: 0, itemCount: 0 },
    coupon: null,
    couponError: null,
  };
}

function renderButton(props: {
  variantId?: string;
  variants?: PublicProductVariant[];
  anonymous?: boolean;
}) {
  if (props.anonymous) {
    vi.mocked(api.getCart).mockRejectedValue(new api.ApiError(401, "no"));
  } else {
    vi.mocked(api.getCart).mockResolvedValue(emptyCart());
  }

  return render(
    <ToastProvider>
      <CartProvider>
        <AddToCartButton
          productName="گان جراحی"
          variantId={props.variantId}
          variants={props.variants}
        />
      </CartProvider>
    </ToastProvider>,
  );
}

describe("AddToCartButton", () => {
  beforeEach(() => {
    vi.mocked(api.getCart).mockReset();
    vi.mocked(api.addCartItem).mockReset();
  });

  it("adds the given variant directly when one is already chosen", async () => {
    const user = userEvent.setup();
    vi.mocked(api.addCartItem).mockResolvedValue(emptyCart());
    renderButton({ variantId: "variant-1" });

    const button = await screen.findByRole("button", { name: "افزودن گان جراحی به سبد خرید" });
    await user.click(button);

    await waitFor(() => expect(api.addCartItem).toHaveBeenCalledWith("variant-1", 1));
    expect(await screen.findByText("محصول به سبد خرید اضافه شد")).toBeInTheDocument();
  });

  it("prompts an anonymous user to log in instead of calling the API", async () => {
    const user = userEvent.setup();
    renderButton({ variantId: "variant-1", anonymous: true });

    const button = await screen.findByRole("button", { name: "افزودن گان جراحی به سبد خرید" });
    await user.click(button);

    expect(
      await screen.findByText("برای خرید ابتدا وارد حساب کاربری شوید."),
    ).toBeInTheDocument();
    expect(api.addCartItem).not.toHaveBeenCalled();
  });

  it("adds the only variant directly when there is no real size choice", async () => {
    const user = userEvent.setup();
    vi.mocked(api.addCartItem).mockResolvedValue(emptyCart());
    renderButton({
      variants: [{ id: "variant-1", size: "تک سایز", price: 100_000, stock: 5, isActive: true }],
    });

    const button = await screen.findByRole("button", { name: "افزودن گان جراحی به سبد خرید" });
    await user.click(button);

    await waitFor(() => expect(api.addCartItem).toHaveBeenCalledWith("variant-1", 1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a size picker when the product has real size choices, and adds the picked one", async () => {
    const user = userEvent.setup();
    vi.mocked(api.addCartItem).mockResolvedValue(emptyCart());
    renderButton({
      variants: [
        { id: "variant-s", size: "S", price: 90_000, stock: 5, isActive: true },
        { id: "variant-l", size: "L", price: 100_000, stock: 5, isActive: true },
      ],
    });

    const button = await screen.findByRole("button", { name: "افزودن گان جراحی به سبد خرید" });
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "L" }));
    await user.click(screen.getByRole("button", { name: "افزودن به سبد خرید" }));

    await waitFor(() => expect(api.addCartItem).toHaveBeenCalledWith("variant-l", 1));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("disables itself while a request is in flight so a double click can't fire twice", async () => {
    const user = userEvent.setup();
    let resolveAdd: (cart: PublicCart) => void = () => {};
    vi.mocked(api.addCartItem).mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );
    renderButton({ variantId: "variant-1" });

    const button = await screen.findByRole("button", { name: "افزودن گان جراحی به سبد خرید" });
    await user.click(button);

    expect(button).toBeDisabled();
    resolveAdd(emptyCart());
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(api.addCartItem).toHaveBeenCalledTimes(1);
  });
});
