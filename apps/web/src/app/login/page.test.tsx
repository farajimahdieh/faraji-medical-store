import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import LoginPage from "./page";
import * as api from "@/lib/api";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
    listWishlist: vi.fn(),
    getMe: vi.fn(),
  };
});

async function submitLogin(isNewUser: boolean) {
  const testUser = {
    id: "u1",
    phone: "+989121110001",
    firstName: null,
    lastName: null,
    birthDate: null,
    role: "customer" as const,
  };
  vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
  vi.mocked(api.requestOtp).mockResolvedValue({ message: "ok" });
  vi.mocked(api.verifyOtp).mockResolvedValue({ user: testUser, isNewUser });
  vi.mocked(api.getMe).mockResolvedValue({ user: testUser });

  const user = userEvent.setup();
  render(
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <LoginPage />
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>,
  );

  await user.type(screen.getByLabelText("شماره موبایل"), "09121110001");
  await user.click(screen.getByRole("button", { name: "ارسال کد" }));
  await user.type(await screen.findByLabelText("کد تایید"), "123456");
  await user.click(screen.getByRole("button", { name: "تایید" }));
  await waitFor(() => expect(api.verifyOtp).toHaveBeenCalled());
}

describe("LoginPage returnTo", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("returns an existing user to a safe internal returnTo", async () => {
    mockSearchParams = new URLSearchParams({ returnTo: "/products/lumbar-belt" });
    await submitLogin(false);
    expect(mockPush).toHaveBeenCalledWith("/products/lumbar-belt");
  });

  it("sends an existing user to /account when there is no returnTo", async () => {
    await submitLogin(false);
    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("falls back to /account for an external returnTo", async () => {
    mockSearchParams = new URLSearchParams({ returnTo: "https://example.com" });
    await submitLogin(false);
    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("forwards returnTo to complete-profile for a new user (signup)", async () => {
    mockSearchParams = new URLSearchParams({ returnTo: "/products/lumbar-belt" });
    await submitLogin(true);
    expect(mockPush).toHaveBeenCalledWith(
      "/complete-profile?returnTo=%2Fproducts%2Flumbar-belt",
    );
  });
});
