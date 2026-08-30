import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { ChatWindow } from "./ChatWindow";
import * as api from "@/lib/api";
import type { ChatResponse, PublicProductListItem } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/consultation",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    sendChatMessage: vi.fn(),
    listWishlist: vi.fn(),
    getCart: vi.fn(),
  };
});

function buildProduct(overrides: Partial<PublicProductListItem> = {}): PublicProductListItem {
  return {
    id: "p1",
    slug: "neck-pillow",
    name: "بالش طبی گردن",
    brand: null,
    primaryImage: null,
    sizes: [],
    variants: [],
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    ...overrides,
  };
}

function renderChatWindow() {
  return render(
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          <ChatWindow />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>,
  );
}

describe("ChatWindow", () => {
  beforeEach(() => {
    vi.mocked(api.sendChatMessage).mockReset();
    vi.mocked(api.listWishlist).mockReset().mockRejectedValue(new api.ApiError(401, "no"));
    vi.mocked(api.getCart).mockReset().mockRejectedValue(new api.ApiError(401, "no"));
  });

  it("shows the intro message on load", () => {
    renderChatWindow();
    expect(screen.getByText(/دستیار مشاور خرید فرجی هستم/)).toBeInTheDocument();
  });

  it("sends the typed message and renders the assistant's reply", async () => {
    const user = userEvent.setup();
    const response: ChatResponse = {
      conversationId: "conv-1",
      message: "درد بیشتر هنگام خواب است یا در طول روز؟",
      products: [],
      needsMoreInfo: true,
    };
    vi.mocked(api.sendChatMessage).mockResolvedValue(response);
    renderChatWindow();

    await user.type(screen.getByPlaceholderText("پیام خود را بنویسید..."), "گردنم درد میکند");
    await user.click(screen.getByRole("button", { name: "ارسال پیام" }));

    expect(await screen.findByText("گردنم درد میکند")).toBeInTheDocument();
    expect(await screen.findByText(response.message)).toBeInTheDocument();
    expect(api.sendChatMessage).toHaveBeenCalledWith("گردنم درد میکند", undefined);
  });

  it("reuses the returned conversationId on the next message", async () => {
    const user = userEvent.setup();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      conversationId: "conv-1",
      message: "باشه",
      products: [],
      needsMoreInfo: true,
    });
    renderChatWindow();

    const input = screen.getByPlaceholderText("پیام خود را بنویسید...");
    await user.type(input, "سلام");
    await user.click(screen.getByRole("button", { name: "ارسال پیام" }));
    await screen.findByText("باشه");

    await user.type(input, "پیام دوم");
    await user.click(screen.getByRole("button", { name: "ارسال پیام" }));

    await waitFor(() =>
      expect(api.sendChatMessage).toHaveBeenLastCalledWith("پیام دوم", "conv-1"),
    );
  });

  it("renders a real product card when the assistant suggests one", async () => {
    const user = userEvent.setup();
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      conversationId: "conv-1",
      message: "این محصول مناسب است",
      products: [buildProduct()],
      needsMoreInfo: false,
    });
    renderChatWindow();

    await user.type(screen.getByPlaceholderText("پیام خود را بنویسید..."), "گردنم درد میکند");
    await user.click(screen.getByRole("button", { name: "ارسال پیام" }));

    expect(await screen.findByText("بالش طبی گردن")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "بالش طبی گردن" })).toHaveAttribute(
      "href",
      "/products/neck-pillow",
    );
  });

  it("shows an error message when the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.sendChatMessage).mockRejectedValue(new api.ApiError(500, "fail"));
    renderChatWindow();

    await user.type(screen.getByPlaceholderText("پیام خود را بنویسید..."), "سلام");
    await user.click(screen.getByRole("button", { name: "ارسال پیام" }));

    expect(await screen.findByText("ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.")).toBeInTheDocument();
  });
});
