import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePopover } from "./ProfilePopover";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import * as api from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, getMe: vi.fn(), logout: vi.fn(), listWishlist: vi.fn() };
});

function renderPopover() {
  return render(
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <ProfilePopover />
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>,
  );
}

describe("ProfilePopover", () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.mocked(api.listWishlist).mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
  });

  it("guest: shows the login CTA with returnTo, no fake account state", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new api.ApiError(401, "no session"));
    renderPopover();

    const trigger = await screen.findByRole("link", { name: "حساب کاربری" });
    fireEvent.focus(trigger);

    expect(await screen.findByText("حساب کاربری")).toBeInTheDocument();
    expect(
      screen.getByText("برای مدیریت اطلاعات، آدرس‌ها و علاقه‌مندی‌ها وارد حساب شوید."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ورود / ثبت‌نام" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Faccount",
    );
  });

  it("logged in: greets the user and shows real links, not fake state", async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      user: {
        id: "u1",
        phone: "+989121110001",
        firstName: "علی",
        lastName: "رضایی",
        birthDate: null,
        role: "customer",
      },
    });
    renderPopover();

    const trigger = await screen.findByRole("link", { name: "حساب کاربری" });
    fireEvent.focus(trigger);

    expect(await screen.findByText("سلام، علی جان")).toBeInTheDocument();
    const accountLinks = screen.getAllByRole("link", { name: "حساب کاربری" });
    expect(accountLinks).toHaveLength(2); // trigger + panel link, both real
    expect(accountLinks[1]).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "آدرس‌های من" })).toHaveAttribute(
      "href",
      "/account?section=addresses",
    );
    expect(screen.getByRole("link", { name: "علاقه‌مندی‌ها" })).toHaveAttribute(
      "href",
      "/wishlist",
    );
    expect(screen.getByRole("button", { name: "خروج" })).toBeInTheDocument();
  });

  it("logout calls the real logout endpoint and redirects to /login", async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      user: {
        id: "u1",
        phone: "+989121110001",
        firstName: "علی",
        lastName: "رضایی",
        birthDate: null,
        role: "customer",
      },
    });
    vi.mocked(api.logout).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPopover();

    const trigger = await screen.findByRole("link", { name: "حساب کاربری" });
    fireEvent.focus(trigger);
    await user.click(await screen.findByRole("button", { name: "خروج" }));

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
