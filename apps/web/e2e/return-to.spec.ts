import { test, expect } from "@playwright/test";
import { getOtpForPhone } from "./otp";

function randomPhone(): string {
  const suffix = Math.floor(100000000 + Math.random() * 900000000);
  return `09${suffix}`;
}

const PRODUCT_SLUG = "محافظ-گچ-و-پانسمان-در-حمام";

test("Wishlist CTA while logged out returns to the same product after login", async ({ page }) => {
  const phone = randomPhone();
  const productPath = `/products/${PRODUCT_SLUG}`;

  await page.goto(productPath);
  const productHeading = await page.getByRole("heading", { level: 1 }).first().textContent();
  await page.getByRole("button", { name: /به علاقه‌مندی‌ها/ }).first().click();

  const loginLink = page.getByRole("link", { name: "ورود به حساب" });
  await expect(loginLink).toHaveAttribute("href", /^\/login\?returnTo=/);
  await loginLink.click();

  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await page.getByLabel("شماره موبایل").fill(phone);
  await page.getByRole("button", { name: "ارسال کد" }).click();
  await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
  const code = await getOtpForPhone(phone);
  await page.getByLabel("کد تایید").fill(code);
  await page.getByRole("button", { name: "تایید" }).click();

  // New user -> complete-profile, returnTo must still be carried through.
  await expect(page).toHaveURL(/\/complete-profile\?returnTo=/);
  await page.getByLabel("نام", { exact: true }).fill("سارا");
  await page.getByLabel("نام خانوادگی").fill("محمدی");
  await page.getByRole("button", { name: "ادامه" }).click();

  // Back on the exact product page (not /account) -- same heading, and the
  // URL is not /account.
  await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(productHeading ?? "");
  await expect(page).not.toHaveURL(/\/account/);
});

test("Jalali birth date survives a refresh unchanged", async ({ page }) => {
  const phone = randomPhone();
  await page.goto("/login");
  await page.getByLabel("شماره موبایل").fill(phone);
  await page.getByRole("button", { name: "ارسال کد" }).click();
  await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
  const code = await getOtpForPhone(phone);
  await page.getByLabel("کد تایید").fill(code);
  await page.getByRole("button", { name: "تایید" }).click();

  await expect(page).toHaveURL(/\/complete-profile/);
  await page.getByLabel("نام", { exact: true }).fill("رضا");
  await page.getByLabel("نام خانوادگی").fill("کریمی");
  await page.getByRole("button", { name: "ادامه" }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("combobox", { name: "روز تولد" }).selectOption("21");
  await page.getByRole("combobox", { name: "ماه تولد" }).selectOption("5");
  await page.getByRole("combobox", { name: "سال تولد" }).selectOption("1378");
  await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();
  await expect(page.getByText("تاریخ انتخابی: ۲۱ مرداد ۱۳۷۸")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("combobox", { name: "روز تولد" })).toHaveValue("21");
  await expect(page.getByRole("combobox", { name: "ماه تولد" })).toHaveValue("5");
  await expect(page.getByRole("combobox", { name: "سال تولد" })).toHaveValue("1378");
  await expect(page.getByText("تاریخ انتخابی: ۲۱ مرداد ۱۳۷۸")).toBeVisible();
});
