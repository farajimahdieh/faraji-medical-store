import { test, expect, type Page } from "@playwright/test";
import { getOtpForPhone } from "./otp";

function randomPhone(): string {
  const suffix = Math.floor(100000000 + Math.random() * 900000000);
  return `09${suffix}`;
}

async function loginNewUser(page: Page, phone: string) {
  await page.goto("/login");
  await page.getByLabel("شماره موبایل").fill(phone);
  await page.getByRole("button", { name: "ارسال کد" }).click();
  await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();

  const code = await getOtpForPhone(phone);
  await page.getByLabel("کد تایید").fill(code);
  await page.getByRole("button", { name: "تایید" }).click();
}

function addressCard(page: Page, title: string) {
  return page.locator("div.rounded-2xl.border.border-border.bg-white.p-5.shadow-sm", {
    hasText: title,
  });
}

test.describe("Account dashboard", () => {
  test("profile edit, birth date persistence, and address management", async ({ page }) => {
    const phone = randomPhone();
    await loginNewUser(page, phone);

    await expect(page).toHaveURL(/\/complete-profile/);
    await page.getByLabel("نام", { exact: true }).fill("علی");
    await page.getByLabel("نام خانوادگی").fill("رضایی");
    await page.getByRole("button", { name: "ادامه" }).click();

    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole("heading", { name: "سلام، علی" })).toBeVisible();

    // --- Edit name and persist across reload ---
    const firstNameField = page.getByRole("textbox", { name: "نام", exact: true });
    await firstNameField.fill("علی‌رضا");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("textbox", { name: "نام", exact: true })).toHaveValue("علی‌رضا");

    // --- Birth date: set, save, reload, verify exact day (no timezone shift) ---
    const birthDateInput = page.locator("#account-birth-date");
    await birthDateInput.fill("1990-05-12");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();

    await page.reload();
    await expect(page.locator("#account-birth-date")).toHaveValue("1990-05-12");

    // --- Addresses: add "خانه" (auto-default), add "محل کار", set it default ---
    await page.getByRole("button", { name: "آدرس‌های من" }).click();
    await page.getByRole("button", { name: "افزودن اولین آدرس" }).click();
    await expect(page.getByText("این آدرس به‌طور خودکار پیش‌فرض خواهد شد.")).toBeVisible();
    await page.getByRole("button", { name: "خانه", exact: true }).click();
    await page.getByRole("textbox", { name: "نام گیرنده" }).fill("علی‌رضا رضایی");
    await page.getByRole("textbox", { name: "شماره گیرنده" }).fill("09121110099");
    await page.getByRole("textbox", { name: "استان" }).fill("تهران");
    await page.getByRole("textbox", { name: "شهر" }).fill("تهران");
    await page.getByRole("textbox", { name: "آدرس کامل" }).fill("خیابان ولیعصر");
    await page.getByRole("textbox", { name: "کد پستی" }).fill("1234567890");
    await page.getByRole("button", { name: "افزودن آدرس", exact: true }).click();
    await expect(page.getByText("آدرس جدید اضافه شد")).toBeVisible();
    await expect(addressCard(page, "خانه").getByText("آدرس پیش‌فرض")).toBeVisible();

    await page.getByRole("button", { name: "افزودن آدرس جدید" }).click();
    await expect(page.getByText("انتخاب به‌عنوان آدرس پیش‌فرض")).toBeVisible();
    await page.getByRole("button", { name: "محل کار", exact: true }).click();
    await page.getByRole("textbox", { name: "نام گیرنده" }).fill("علی‌رضا رضایی");
    await page.getByRole("textbox", { name: "شماره گیرنده" }).fill("09121110099");
    await page.getByRole("textbox", { name: "استان" }).fill("تهران");
    await page.getByRole("textbox", { name: "شهر" }).fill("تهران");
    await page.getByRole("textbox", { name: "آدرس کامل" }).fill("خیابان انقلاب");
    await page.getByRole("textbox", { name: "کد پستی" }).fill("1234567891");
    await page.getByRole("button", { name: "افزودن آدرس", exact: true }).click();
    await expect(page.getByText("آدرس جدید اضافه شد")).toBeVisible();

    // Only "خانه" should be default right now
    await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);

    await addressCard(page, "محل کار")
      .getByRole("button", { name: "انتخاب به‌عنوان پیش‌فرض" })
      .click();
    await expect(page.getByText("آدرس پیش‌فرض تغییر کرد")).toBeVisible();
    await expect(addressCard(page, "محل کار").getByText("آدرس پیش‌فرض")).toBeVisible();
    await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);

    await page.reload();
    await page.getByRole("button", { name: "آدرس‌های من" }).click();
    await expect(addressCard(page, "محل کار").getByText("آدرس پیش‌فرض")).toBeVisible();
    await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);

    // --- Edit the "خانه" address ---
    await addressCard(page, "خانه").getByRole("button", { name: "ویرایش" }).click();
    const editNameField = page.getByRole("textbox", { name: "نام گیرنده" });
    await editNameField.fill("علی رضایی ویرایش‌شده");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("آدرس ویرایش شد")).toBeVisible();
    await expect(page.getByText("علی رضایی ویرایش‌شده")).toBeVisible();

    // --- Delete the default address ("محل کار") -> another gets promoted ---
    await addressCard(page, "محل کار").getByRole("button", { name: "حذف" }).click();
    await expect(page.getByText("این آدرس حذف شود؟")).toBeVisible();
    await page.getByRole("button", { name: "بله، حذف شود" }).click();
    await expect(page.getByText("آدرس حذف شد")).toBeVisible();
    await expect(page.getByText("محل کار")).not.toBeVisible();
    await expect(addressCard(page, "خانه").getByText("آدرس پیش‌فرض")).toBeVisible();
    await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);

    // --- Coupons section renders without crashing ---
    await page.getByRole("button", { name: "کدهای تخفیف من" }).click();
    await expect(page.getByText("فعلاً کد تخفیفی برای حساب شما فعال نیست")).toBeVisible();

    // --- Wishlist link present in the account nav (scoped away from the
    // site header's own wishlist icon, which shares the same accessible name) ---
    await expect(
      page
        .getByRole("navigation", { name: "ناوبری حساب کاربری" })
        .getByRole("link", { name: /علاقه‌مندی‌ها/ }),
    ).toHaveAttribute("href", "/wishlist");
  });

  test("mobile viewport: no horizontal overflow, RTL, direct tab navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const phone = randomPhone();
    await loginNewUser(page, phone);

    await expect(page).toHaveURL(/\/complete-profile/);
    await page.getByLabel("نام", { exact: true }).fill("مریم");
    await page.getByLabel("نام خانوادگی").fill("احمدی");
    await page.getByRole("button", { name: "ادامه" }).click();
    await expect(page).toHaveURL(/\/account/);

    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    // Mobile nav tabs are tappable and switch sections directly (no hover simulation).
    await page.getByRole("button", { name: "آدرس‌های من" }).click();
    await expect(page.getByText("هنوز آدرسی ثبت نکرده‌اید")).toBeVisible();

    await page.getByRole("button", { name: "کدهای تخفیف من" }).click();
    await expect(page.getByText("فعلاً کد تخفیفی برای حساب شما فعال نیست")).toBeVisible();
  });
});
