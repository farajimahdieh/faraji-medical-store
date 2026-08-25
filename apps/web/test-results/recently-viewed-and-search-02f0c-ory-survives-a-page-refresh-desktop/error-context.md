# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recently-viewed-and-search.spec.ts >> a logged-in user's search history survives a page refresh
- Location: e2e\recently-viewed-and-search.spec.ts:56:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('کد ۶ رقمی برای 09702584432 ارسال شد.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('کد ۶ رقمی برای 09702584432 ارسال شد.')

```

```yaml
- banner:
  - link "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی تجهیزات پزشکی و آزمایشگاهی فرجی Faraji Medical / Laboratory Equipment":
    - /url: /
    - img "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی"
    - text: تجهیزات پزشکی و آزمایشگاهی فرجی Faraji Medical / Laboratory Equipment
  - search:
    - combobox "جستجو در محصولات"
  - link "حساب کاربری":
    - /url: /login?returnTo=%2Faccount
  - link "علاقه‌مندی‌ها":
    - /url: /wishlist
  - link "سبد خرید":
    - /url: /cart
  - button "دسته‌بندی‌ها"
  - link "محصولات":
    - /url: /products
  - link "راهنمای خرید":
    - /url: /guides
  - link "مشاوره هوشمند":
    - /url: /consultation
  - link "درباره ما":
    - /url: /about
  - link "تماس با ما":
    - /url: /contact
- main:
  - heading "ورود / ثبت‌نام" [level=1]
  - text: شماره موبایل
  - textbox "شماره موبایل":
    - /placeholder: 09xxxxxxxxx
    - text: "09702584432"
  - paragraph: "ThrottlerException: Too Many Requests"
  - button "ارسال کد"
- contentinfo:
  - img "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی"
  - text: تجهیزات پزشکی و آزمایشگاهی فرجی Faraji Medical / Laboratory Equipment
  - paragraph: بیش از ۱۵ سال تجربه فروش حضوری در تبریز، همراه شما برای انتخاب مطمئن
  - heading "دسته‌بندی‌ها" [level=3]
  - list:
    - listitem:
      - link "پانسمان و زخم بستر":
        - /url: /categories/dressing-wound-care
    - listitem:
      - link "تجهیزات مصرفی پزشکی":
        - /url: /categories/medical-consumables
    - listitem:
      - link "تجهیزات ارتوپدی":
        - /url: /categories/orthopedic-mobility-rehab
    - listitem:
      - link "تجهیزات تنفسی":
        - /url: /categories/diagnostics-respiratory
    - listitem:
      - link "تجهیزات آزمایشگاهی":
        - /url: /categories/lab-equipment
  - heading "لینک‌های سریع" [level=3]
  - list:
    - listitem:
      - link "درباره ما":
        - /url: /about
    - listitem:
      - link "راهنمای خرید":
        - /url: /guides
    - listitem:
      - link "سوالات متداول":
        - /url: /faq
    - listitem:
      - link "شرایط و قوانین":
        - /url: /terms
    - listitem:
      - link "حریم خصوصی":
        - /url: /privacy
    - listitem:
      - link "پیگیری سفارش":
        - /url: /orders/track
  - heading "تماس با ما" [level=3]
  - text: تبریز، خیابان ارتش جنوبی، نرسیده به بیمارستان بهبود، جنب مجتمع خدماتی ماهان، پلاک ۶ 041-35573134 0914 453 7073 gholamrezafaraji50@gmail.com
  - link "اینستاگرام faraji.medical":
    - /url: "#"
  - link "تلگرام faraji.medical":
    - /url: "#"
  - text: "@faraji.medical"
  - paragraph: © 2026 تجهیزات پزشکی و آزمایشگاهی فرجی. تمامی حقوق محفوظ است.
- status
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { getOtpForPhone } from "./otp";
  3  | 
  4  | function randomPhone(): string {
  5  |   const suffix = Math.floor(100000000 + Math.random() * 900000000);
  6  |   return `09${suffix}`;
  7  | }
  8  | 
  9  | const PRODUCT_A = "محافظ-گچ-و-پانسمان-در-حمام";
  10 | const PRODUCT_B = "محافظ-گچ-و-پانسمان-در-حمام-2";
  11 | const PRODUCT_C = "آتل-انگشت-دست-و-پا";
  12 | 
  13 | async function login(page: import("@playwright/test").Page, phone: string) {
  14 |   await page.goto("/login");
  15 |   await page.getByLabel("شماره موبایل").fill(phone);
  16 |   await page.getByRole("button", { name: "ارسال کد" }).click();
> 17 |   await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  18 |   const code = await getOtpForPhone(phone);
  19 |   await page.getByLabel("کد تایید").fill(code);
  20 |   await page.getByRole("button", { name: "تایید" }).click();
  21 | 
  22 |   await expect(page).toHaveURL(/\/complete-profile/);
  23 |   await page.getByLabel("نام", { exact: true }).fill("نگار");
  24 |   await page.getByLabel("نام خانوادگی").fill("حسینی");
  25 |   await page.getByRole("button", { name: "ادامه" }).click();
  26 |   await expect(page).toHaveURL(/\/account/);
  27 | }
  28 | 
  29 | test("visiting a second product shows it as recently viewed on the next product", async ({
  30 |   page,
  31 | }) => {
  32 |   const phone = randomPhone();
  33 |   await login(page, phone);
  34 | 
  35 |   // The section only renders once at least 2 *other* products have been
  36 |   // viewed -- visit two before landing on the third to check it.
  37 |   await page.goto(`/products/${PRODUCT_A}`);
  38 |   await page.waitForTimeout(500); // let the view-record POST fire before navigating away
  39 |   await page.goto(`/products/${PRODUCT_C}`);
  40 |   await page.waitForTimeout(500);
  41 | 
  42 |   await page.goto(`/products/${PRODUCT_B}`);
  43 | 
  44 |   await expect(page.getByText("محصولات اخیراً دیده‌شده")).toBeVisible();
  45 |   // Desktop-grid link, not the CSS-hidden mobile-scroll-row duplicate --
  46 |   // the mobile block renders first in DOM order, so .last() is the visible
  47 |   // (lg:grid) one at this viewport.
  48 |   await expect(
  49 |     page.locator(`a[href="/products/${encodeURIComponent(PRODUCT_A)}"]`).last(),
  50 |   ).toBeVisible();
  51 |   await expect(
  52 |     page.locator(`a[href="/products/${encodeURIComponent(PRODUCT_C)}"]`).last(),
  53 |   ).toBeVisible();
  54 | });
  55 | 
  56 | test("a logged-in user's search history survives a page refresh", async ({ page }) => {
  57 |   const phone = randomPhone();
  58 |   await login(page, phone);
  59 | 
  60 |   // The hard navigation remounts the whole app, including AuthProvider --
  61 |   // wait for it to resolve to "authenticated" before searching, or the
  62 |   // history POST would (wrongly) take the guest/localStorage path instead.
  63 |   await page.goto("/");
  64 |   await expect(page.getByRole("link", { name: "حساب کاربری" })).toHaveAttribute(
  65 |     "href",
  66 |     "/account",
  67 |   );
  68 |   const searchInput = page.getByRole("combobox", { name: "جستجو در محصولات" });
  69 |   await searchInput.fill("زانوبند");
  70 |   await searchInput.press("Enter");
  71 |   await expect(page).toHaveURL(/\/products\?q=/);
  72 |   // The history POST is fire-and-forget so the search itself never waits on
  73 |   // it -- give it a moment to land before the next hard navigation, which
  74 |   // would otherwise cancel any request still in flight.
  75 |   await page.waitForTimeout(500);
  76 | 
  77 |   await page.goto("/");
  78 |   await page.reload();
  79 |   const inputAfterReload = page.getByRole("combobox", { name: "جستجو در محصولات" });
  80 |   await inputAfterReload.click();
  81 |   const listbox = page.getByRole("listbox", { name: "جستجوهای اخیر" });
  82 |   await expect(listbox.getByText("زانوبند")).toBeVisible();
  83 | });
  84 | 
```