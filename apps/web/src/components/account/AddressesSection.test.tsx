import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AddressesSection } from "./AddressesSection";
import * as api from "@/lib/api";
import type { PublicUserAddress } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return {
    ...actual,
    listAddresses: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  };
});

function buildAddress(overrides?: Partial<PublicUserAddress>): PublicUserAddress {
  return {
    id: "addr-1",
    title: "خانه",
    recipientName: "علی رضایی",
    recipientPhone: "+989121110001",
    province: "تهران",
    city: "تهران",
    addressLine: "خیابان ولیعصر",
    postalCode: "1234567890",
    buildingNumber: "10",
    unit: "2",
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderSection() {
  render(
    <ToastProvider>
      <AddressesSection />
    </ToastProvider>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "نام گیرنده" }), "علی رضایی");
  await user.type(screen.getByRole("textbox", { name: "شماره گیرنده" }), "09121110001");
  await user.type(screen.getByRole("textbox", { name: "استان" }), "تهران");
  await user.type(screen.getByRole("textbox", { name: "شهر" }), "تهران");
  await user.type(screen.getByRole("textbox", { name: "آدرس کامل" }), "خیابان ولیعصر");
  await user.type(screen.getByRole("textbox", { name: "کد پستی" }), "1234567890");
}

describe("AddressesSection", () => {
  beforeEach(() => {
    vi.mocked(api.listAddresses).mockReset();
    vi.mocked(api.createAddress).mockReset();
    vi.mocked(api.updateAddress).mockReset();
    vi.mocked(api.deleteAddress).mockReset();
    vi.mocked(api.setDefaultAddress).mockReset();
  });

  it("shows a loading state, not the empty state, while the list is in flight", async () => {
    let resolveList: (value: PublicUserAddress[]) => void = () => {};
    vi.mocked(api.listAddresses).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );
    renderSection();

    expect(screen.queryByText("هنوز آدرسی ثبت نکرده‌اید")).not.toBeInTheDocument();
    resolveList([]);
    expect(await screen.findByText("هنوز آدرسی ثبت نکرده‌اید")).toBeInTheDocument();
  });

  it("shows an error state with retry when the fetch fails", async () => {
    vi.mocked(api.listAddresses).mockRejectedValueOnce(new Error("boom"));
    renderSection();

    expect(
      await screen.findByText("دریافت اطلاعات انجام نشد. دوباره تلاش کنید."),
    ).toBeInTheDocument();
  });

  it("adds the first address (auto-default note shown instead of the checkbox)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAddresses)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([buildAddress()]);
    vi.mocked(api.createAddress).mockResolvedValue(buildAddress());
    renderSection();

    await user.click(await screen.findByRole("button", { name: "افزودن اولین آدرس" }));
    expect(screen.getByText("این آدرس به‌طور خودکار پیش‌فرض خواهد شد.")).toBeInTheDocument();
    expect(screen.queryByText("انتخاب به‌عنوان آدرس پیش‌فرض")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "خانه" }));
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "افزودن آدرس" }));

    await waitFor(() => expect(api.createAddress).toHaveBeenCalled());
    expect(await screen.findByText("آدرس جدید اضافه شد")).toBeInTheDocument();
    expect(await screen.findByText("آدرس پیش‌فرض")).toBeInTheDocument();
  });

  it("shows the default-option checkbox when a default already exists", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAddresses).mockResolvedValue([buildAddress()]);
    renderSection();

    await user.click(await screen.findByRole("button", { name: "افزودن آدرس جدید" }));
    expect(screen.getByText("انتخاب به‌عنوان آدرس پیش‌فرض")).toBeInTheDocument();
  });

  it("edits an existing address", async () => {
    const user = userEvent.setup();
    const original = buildAddress();
    vi.mocked(api.listAddresses)
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([{ ...original, recipientName: "زهرا احمدی" }]);
    vi.mocked(api.updateAddress).mockResolvedValue({ ...original, recipientName: "زهرا احمدی" });
    renderSection();

    await user.click(await screen.findByRole("button", { name: "ویرایش" }));
    const nameField = await screen.findByRole("textbox", { name: "نام گیرنده" });
    await user.clear(nameField);
    await user.type(nameField, "زهرا احمدی");
    await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    await waitFor(() =>
      expect(api.updateAddress).toHaveBeenCalledWith(
        "addr-1",
        expect.objectContaining({ recipientName: "زهرا احمدی" }),
      ),
    );
    expect(await screen.findByText("زهرا احمدی")).toBeInTheDocument();
  });

  it("deletes an address after a light inline confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAddresses)
      .mockResolvedValueOnce([buildAddress()])
      .mockResolvedValueOnce([]);
    vi.mocked(api.deleteAddress).mockResolvedValue(undefined);
    renderSection();

    await user.click(await screen.findByRole("button", { name: "حذف" }));
    expect(screen.getByText("این آدرس حذف شود؟")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "بله، حذف شود" }));

    await waitFor(() => expect(api.deleteAddress).toHaveBeenCalledWith("addr-1"));
    expect(await screen.findByText("هنوز آدرسی ثبت نکرده‌اید")).toBeInTheDocument();
  });

  it("cancelling the delete confirmation keeps the address", async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAddresses).mockResolvedValue([buildAddress()]);
    renderSection();

    await user.click(await screen.findByRole("button", { name: "حذف" }));
    await user.click(screen.getByRole("button", { name: "انصراف" }));

    expect(screen.queryByText("این آدرس حذف شود؟")).not.toBeInTheDocument();
    expect(api.deleteAddress).not.toHaveBeenCalled();
  });

  it("sets a non-default address as default, leaving exactly one default badge", async () => {
    const user = userEvent.setup();
    const home = buildAddress({ id: "addr-1", title: "خانه", isDefault: true });
    const work = buildAddress({ id: "addr-2", title: "محل کار", isDefault: false });
    vi.mocked(api.listAddresses)
      .mockResolvedValueOnce([home, work])
      .mockResolvedValueOnce([{ ...home, isDefault: false }, { ...work, isDefault: true }]);
    vi.mocked(api.setDefaultAddress).mockResolvedValue({ ...work, isDefault: true });
    renderSection();

    await screen.findByText("خانه");
    await user.click(screen.getByRole("button", { name: "انتخاب به‌عنوان پیش‌فرض" }));

    await waitFor(() => expect(api.setDefaultAddress).toHaveBeenCalledWith("addr-2"));
    const badges = await screen.findAllByText("آدرس پیش‌فرض");
    expect(badges).toHaveLength(1);
  });
});
