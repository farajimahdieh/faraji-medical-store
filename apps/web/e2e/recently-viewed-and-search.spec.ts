import { test, expect } from "@playwright/test";
import { getOtpForPhone } from "./otp";

function randomPhone(): string {
  const suffix = Math.floor(100000000 + Math.random() * 900000000);
  return `09${suffix}`;
}

const PRODUCT_A = "محافظ-گچ-و-پانسمان-در-حمام";
const PRODUCT_B = "محافظ-گچ-و-پانسمان-در-حمام-2";
const PRODUCT_C = "آتل-انگشت-دست-و-پا";

async function login(page: import("@playwright/test").Page, phone: string) {
  await page.goto("/login");
  await page.getByLabel("شماره موبایل").fill(phone);
  await page.getByRole("button", { name: "ارسال کد" }).click();
  await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
  const code = await getOtpForPhone(phone);
  await page.getByLabel("کد تایید").fill(code);
  await page.getByRole("button", { name: "تایید" }).click();

  await expect(page).toHaveURL(/\/complete-profile/);
  await page.getByLabel("نام", { exact: true }).fill("نگار");
  await page.getByLabel("نام خانوادگی").fill("حسینی");
  await page.getByRole("button", { name: "ادامه" }).click();
  await expect(page).toHaveURL(/\/account/);
}

test("visiting a second product shows it as recently viewed on the next product", async ({
  page,
}) => {
  const phone = randomPhone();
  await login(page, phone);

  // The section only renders once at least 2 *other* products have been
  // viewed -- visit two before landing on the third to check it.
  await page.goto(`/products/${PRODUCT_A}`);
  await page.waitForTimeout(500); // let the view-record POST fire before navigating away
  await page.goto(`/products/${PRODUCT_C}`);
  await page.waitForTimeout(500);

  await page.goto(`/products/${PRODUCT_B}`);

  await expect(page.getByText("محصولات اخیراً دیده‌شده")).toBeVisible();
  // Desktop-grid link, not the CSS-hidden mobile-scroll-row duplicate --
  // the mobile block renders first in DOM order, so .last() is the visible
  // (lg:grid) one at this viewport.
  await expect(
    page.locator(`a[href="/products/${encodeURIComponent(PRODUCT_A)}"]`).last(),
  ).toBeVisible();
  await expect(
    page.locator(`a[href="/products/${encodeURIComponent(PRODUCT_C)}"]`).last(),
  ).toBeVisible();
});

test("a logged-in user's search history survives a page refresh", async ({ page }) => {
  const phone = randomPhone();
  await login(page, phone);

  // The hard navigation remounts the whole app, including AuthProvider --
  // wait for it to resolve to "authenticated" before searching, or the
  // history POST would (wrongly) take the guest/localStorage path instead.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "حساب کاربری" })).toHaveAttribute(
    "href",
    "/account",
  );
  const searchInput = page.getByRole("combobox", { name: "جستجو در محصولات" });
  await searchInput.fill("زانوبند");
  await searchInput.press("Enter");
  await expect(page).toHaveURL(/\/products\?q=/);
  // The history POST is fire-and-forget so the search itself never waits on
  // it -- give it a moment to land before the next hard navigation, which
  // would otherwise cancel any request still in flight.
  await page.waitForTimeout(500);

  await page.goto("/");
  await page.reload();
  const inputAfterReload = page.getByRole("combobox", { name: "جستجو در محصولات" });
  await inputAfterReload.click();
  const listbox = page.getByRole("listbox", { name: "جستجوهای اخیر" });
  await expect(listbox.getByText("زانوبند")).toBeVisible();
});
