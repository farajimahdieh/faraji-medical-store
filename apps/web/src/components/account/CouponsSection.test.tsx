import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CouponsSection } from "./CouponsSection";
import { formatToman } from "@/data/products";
import * as api from "@/lib/api";
import type { PublicDiscountCode } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, listMyCoupons: vi.fn() };
});

function buildCoupon(overrides?: Partial<PublicDiscountCode>): PublicDiscountCode {
  return {
    id: "coupon-1",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    startsAt: null,
    expiresAt: null,
    minimumOrderAmount: null,
    isPersonal: false,
    ...overrides,
  };
}

function renderSection() {
  render(
    <ToastProvider>
      <CouponsSection />
    </ToastProvider>,
  );
}

describe("CouponsSection", () => {
  beforeEach(() => {
    vi.mocked(api.listMyCoupons).mockReset();
  });

  it("shows a loading state before the empty state appears", async () => {
    let resolveList: (value: PublicDiscountCode[]) => void = () => {};
    vi.mocked(api.listMyCoupons).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );
    renderSection();

    expect(screen.queryByText("فعلاً کد تخفیفی برای حساب شما فعال نیست")).not.toBeInTheDocument();
    resolveList([]);
    expect(
      await screen.findByText("فعلاً کد تخفیفی برای حساب شما فعال نیست"),
    ).toBeInTheDocument();
  });

  it("shows an error state with retry when the fetch fails", async () => {
    vi.mocked(api.listMyCoupons).mockRejectedValueOnce(new Error("boom"));
    renderSection();

    expect(
      await screen.findByText("دریافت اطلاعات انجام نشد. دوباره تلاش کنید."),
    ).toBeInTheDocument();
  });

  it("renders a percentage coupon", async () => {
    vi.mocked(api.listMyCoupons).mockResolvedValue([buildCoupon({ type: "percentage", value: 15 })]);
    renderSection();

    expect(await screen.findByText("WELCOME10")).toBeInTheDocument();
    expect(screen.getByText(`${(15).toLocaleString("fa-IR")}% تخفیف`)).toBeInTheDocument();
  });

  it("renders a fixed-amount coupon using the shared Toman formatter", async () => {
    vi.mocked(api.listMyCoupons).mockResolvedValue([
      buildCoupon({ code: "OFF50K", type: "fixed_amount", value: 50000 }),
    ]);
    renderSection();

    expect(await screen.findByText(formatToman(50000))).toBeInTheDocument();
  });

  it("shows expiry and minimum order amount when present", async () => {
    vi.mocked(api.listMyCoupons).mockResolvedValue([
      buildCoupon({ expiresAt: "2026-12-31T00:00:00.000Z", minimumOrderAmount: 200000 }),
    ]);
    renderSection();

    expect(await screen.findByText("تاریخ انقضا")).toBeInTheDocument();
    expect(screen.getByText("حداقل مبلغ سفارش")).toBeInTheDocument();
  });

  it("copies the coupon code and shows a confirmation toast", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listMyCoupons).mockResolvedValue([buildCoupon()]);
    renderSection();

    await user.click(await screen.findByRole("button", { name: "کپی کد" }));

    expect(await screen.findByText("کد تخفیف کپی شد")).toBeInTheDocument();
    await expect(navigator.clipboard.readText()).resolves.toBe("WELCOME10");
  });
});
