"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  applyCoupon as apiApplyCoupon,
  clearCart as apiClearCart,
  removeCoupon as apiRemoveCoupon,
  getCart,
  removeCartItem,
  updateCartItem,
  ApiError,
  type PublicCart,
  type PublicCartCoupon,
  type PublicCartItem,
  type PublicCartSummary,
} from "@/lib/api";
import { useToast } from "@/components/toast/ToastProvider";

export type CartStatus = "loading" | "anonymous" | "ready";

const EMPTY_SUMMARY: PublicCartSummary = {
  subtotal: 0,
  discountAmount: 0,
  shippingAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  itemCount: 0,
};

interface CartContextValue {
  status: CartStatus;
  items: PublicCartItem[];
  summary: PublicCartSummary;
  coupon: PublicCartCoupon | null;
  couponError: string | null;
  /** Authoritative item count from the backend -- badges read this. */
  count: number;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  /** Re-fetch from the server -- call right after a successful login. */
  refresh: () => Promise<void>;
  /** Clear to the anonymous state without a network round-trip -- call on logout. */
  reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<CartStatus>("loading");
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [summary, setSummary] = useState<PublicCartSummary>(EMPTY_SUMMARY);
  const [coupon, setCoupon] = useState<PublicCartCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const applyCart = useCallback((cart: PublicCart) => {
    setItems(cart.items);
    setSummary(cart.summary);
    setCoupon(cart.coupon);
    setCouponError(cart.couponError);
    setStatus("ready");
  }, []);

  const toAnonymous = useCallback(() => {
    setItems([]);
    setSummary(EMPTY_SUMMARY);
    setCoupon(null);
    setCouponError(null);
    setStatus("anonymous");
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyCart(await getCart());
    } catch {
      toAnonymous();
    }
  }, [applyCart, toAnonymous]);

  // Mount fetch: setState only happens inside the promise handlers, never
  // synchronously in the effect body itself.
  useEffect(() => {
    getCart().then(applyCart).catch(toAnonymous);
  }, [applyCart, toAnonymous]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      try {
        applyCart(await addCartItem(variantId, quantity));
        showToast("محصول به سبد خرید اضافه شد", { variant: "success" });
        return true;
      } catch (error) {
        showToast(errorMessage(error, "افزودن به سبد خرید انجام نشد"), { variant: "error" });
        return false;
      }
    },
    [applyCart, showToast],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        applyCart(await updateCartItem(itemId, quantity));
        return true;
      } catch (error) {
        showToast(errorMessage(error, "به‌روزرسانی تعداد انجام نشد"), { variant: "error" });
        return false;
      }
    },
    [applyCart, showToast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        applyCart(await removeCartItem(itemId));
        showToast("کالا از سبد خرید حذف شد", { variant: "info" });
        return true;
      } catch (error) {
        showToast(errorMessage(error, "حذف کالا انجام نشد"), { variant: "error" });
        return false;
      }
    },
    [applyCart, showToast],
  );

  const clearCart = useCallback(async () => {
    try {
      applyCart(await apiClearCart());
      showToast("سبد خرید خالی شد", { variant: "info" });
      return true;
    } catch (error) {
      showToast(errorMessage(error, "خالی کردن سبد خرید انجام نشد"), { variant: "error" });
      return false;
    }
  }, [applyCart, showToast]);

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        applyCart(await apiApplyCoupon(code));
        showToast("کد تخفیف اعمال شد", { variant: "success" });
        return true;
      } catch (error) {
        showToast(errorMessage(error, "کد تخفیف نامعتبر است"), { variant: "error" });
        return false;
      }
    },
    [applyCart, showToast],
  );

  const removeCoupon = useCallback(async () => {
    try {
      applyCart(await apiRemoveCoupon());
      return true;
    } catch (error) {
      showToast(errorMessage(error, "حذف کد تخفیف انجام نشد"), { variant: "error" });
      return false;
    }
  }, [applyCart, showToast]);

  return (
    <CartContext.Provider
      value={{
        status,
        items,
        summary,
        coupon,
        couponError,
        count: summary.itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refresh,
        reset: toAnonymous,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
