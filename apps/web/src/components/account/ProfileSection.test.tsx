import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { ProfileSection } from "./ProfileSection";
import { gregorianToJalali } from "@/lib/jalali";
import * as api from "@/lib/api";
import type { PublicUser } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, completeProfile: vi.fn() };
});

function buildUser(overrides?: Partial<PublicUser>): PublicUser {
  return {
    id: "user-1",
    phone: "+989121110001",
    firstName: "علی",
    lastName: "رضایی",
    birthDate: null,
    role: "customer",
    ...overrides,
  };
}

function renderSection(user: PublicUser, onUserChange = vi.fn()) {
  render(
    <ToastProvider>
      <ProfileSection user={user} onUserChange={onUserChange} />
    </ToastProvider>,
  );
  return { onUserChange };
}

describe("ProfileSection", () => {
  beforeEach(() => {
    vi.mocked(api.completeProfile).mockReset();
  });

  it("renders the current profile values, birth date shown as Jalali", () => {
    renderSection(buildUser({ birthDate: "1990-05-12" }));
    const { jy, jm, jd } = gregorianToJalali("1990-05-12");

    expect(screen.getByRole("textbox", { name: "نام" })).toHaveValue("علی");
    expect(screen.getByRole("textbox", { name: "نام خانوادگی" })).toHaveValue("رضایی");
    expect(screen.getByLabelText("شماره موبایل")).toHaveValue("+989121110001");
    expect(screen.getByRole("combobox", { name: "روز تولد" })).toHaveValue(String(jd));
    expect(screen.getByRole("combobox", { name: "ماه تولد" })).toHaveValue(String(jm));
    expect(screen.getByRole("combobox", { name: "سال تولد" })).toHaveValue(String(jy));
  });

  it("keeps the phone number read-only", () => {
    renderSection(buildUser());
    expect(screen.getByLabelText("شماره موبایل")).toHaveAttribute("readonly");
  });

  it("disables save until something changes", async () => {
    const user = userEvent.setup();
    renderSection(buildUser());

    expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "نام" }), "ی");
    expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeEnabled();
  });

  it("edits first/last name and saves successfully", async () => {
    const user = userEvent.setup();
    vi.mocked(api.completeProfile).mockResolvedValue({
      user: buildUser({ firstName: "علی‌رضا" }),
    });
    const { onUserChange } = renderSection(buildUser());

    await user.clear(screen.getByRole("textbox", { name: "نام" }));
    await user.type(screen.getByRole("textbox", { name: "نام" }), "علی‌رضا");
    await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    await waitFor(() =>
      expect(api.completeProfile).toHaveBeenCalledWith("علی‌رضا", "رضایی", undefined),
    );
    expect(await screen.findByText("اطلاعات حساب شما ذخیره شد")).toBeInTheDocument();
    expect(onUserChange).toHaveBeenCalledWith(buildUser({ firstName: "علی‌رضا" }));
  });

  it("saves an optional birth date, converting Jalali selection to a Gregorian string", async () => {
    const user = userEvent.setup();
    const { jy, jm, jd } = gregorianToJalali("1995-03-20");
    vi.mocked(api.completeProfile).mockResolvedValue({
      user: buildUser({ birthDate: "1995-03-20" }),
    });
    renderSection(buildUser());

    await user.selectOptions(screen.getByRole("combobox", { name: "روز تولد" }), String(jd));
    await user.selectOptions(screen.getByRole("combobox", { name: "ماه تولد" }), String(jm));
    await user.selectOptions(screen.getByRole("combobox", { name: "سال تولد" }), String(jy));
    await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    await waitFor(() =>
      expect(api.completeProfile).toHaveBeenCalledWith("علی", "رضایی", "1995-03-20"),
    );
  });

  it("rejects a future birth date client-side without calling the API", async () => {
    renderSection(buildUser());

    // "Tomorrow" is always in the future relative to the real clock, and
    // still Jalali-valid regardless of when this test runs.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
      tomorrow.getDate(),
    ).padStart(2, "0")}`;
    const { jy, jm, jd } = gregorianToJalali(iso);

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox", { name: "روز تولد" }), String(jd));
    await user.selectOptions(screen.getByRole("combobox", { name: "ماه تولد" }), String(jm));
    await user.selectOptions(screen.getByRole("combobox", { name: "سال تولد" }), String(jy));

    expect(await screen.findByText("تاریخ تولد نمی‌تواند در آینده باشد")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeDisabled();
    expect(api.completeProfile).not.toHaveBeenCalled();
  });

  it("shows a generic error toast when saving fails, without leaking the raw API message", async () => {
    const user = userEvent.setup();
    vi.mocked(api.completeProfile).mockRejectedValue(new api.ApiError(500, "internal detail"));
    renderSection(buildUser());

    await user.type(screen.getByRole("textbox", { name: "نام" }), "ی");
    await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    expect(
      await screen.findByText("ذخیره تغییرات انجام نشد. دوباره تلاش کنید."),
    ).toBeInTheDocument();
    expect(screen.queryByText("internal detail")).not.toBeInTheDocument();
  });

  it("cancel reverts unsaved changes", async () => {
    const user = userEvent.setup();
    renderSection(buildUser());

    await user.type(screen.getByRole("textbox", { name: "نام" }), "ی");
    await user.click(screen.getByRole("button", { name: "لغو تغییرات" }));

    expect(screen.getByRole("textbox", { name: "نام" })).toHaveValue("علی");
    expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeDisabled();
  });
});
