# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: return-to.spec.ts >> Jalali birth date survives a refresh unchanged
- Location: e2e\return-to.spec.ts:43:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('کد ۶ رقمی برای 09433666998 ارسال شد.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('کد ۶ رقمی برای 09433666998 ارسال شد.')

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
    - text: "09433666998"
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
  9  | const PRODUCT_SLUG = "محافظ-گچ-و-پانسمان-در-حمام";
  10 | 
  11 | test("Wishlist CTA while logged out returns to the same product after login", async ({ page }) => {
  12 |   const phone = randomPhone();
  13 |   const productPath = `/products/${PRODUCT_SLUG}`;
  14 | 
  15 |   await page.goto(productPath);
  16 |   const productHeading = await page.getByRole("heading", { level: 1 }).first().textContent();
  17 |   await page.getByRole("button", { name: /به علاقه‌مندی‌ها/ }).first().click();
  18 | 
  19 |   const loginLink = page.getByRole("link", { name: "ورود به حساب" });
  20 |   await expect(loginLink).toHaveAttribute("href", /^\/login\?returnTo=/);
  21 |   await loginLink.click();
  22 | 
  23 |   await expect(page).toHaveURL(/\/login\?returnTo=/);
  24 |   await page.getByLabel("شماره موبایل").fill(phone);
  25 |   await page.getByRole("button", { name: "ارسال کد" }).click();
  26 |   await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
  27 |   const code = await getOtpForPhone(phone);
  28 |   await page.getByLabel("کد تایید").fill(code);
  29 |   await page.getByRole("button", { name: "تایید" }).click();
  30 | 
  31 |   // New user -> complete-profile, returnTo must still be carried through.
  32 |   await expect(page).toHaveURL(/\/complete-profile\?returnTo=/);
  33 |   await page.getByLabel("نام", { exact: true }).fill("سارا");
  34 |   await page.getByLabel("نام خانوادگی").fill("محمدی");
  35 |   await page.getByRole("button", { name: "ادامه" }).click();
  36 | 
  37 |   // Back on the exact product page (not /account) -- same heading, and the
  38 |   // URL is not /account.
  39 |   await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(productHeading ?? "");
  40 |   await expect(page).not.toHaveURL(/\/account/);
  41 | });
  42 | 
  43 | test("Jalali birth date survives a refresh unchanged", async ({ page }) => {
  44 |   const phone = randomPhone();
  45 |   await page.goto("/login");
  46 |   await page.getByLabel("شماره موبایل").fill(phone);
  47 |   await page.getByRole("button", { name: "ارسال کد" }).click();
> 48 |   await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  49 |   const code = await getOtpForPhone(phone);
  50 |   await page.getByLabel("کد تایید").fill(code);
  51 |   await page.getByRole("button", { name: "تایید" }).click();
  52 | 
  53 |   await expect(page).toHaveURL(/\/complete-profile/);
  54 |   await page.getByLabel("نام", { exact: true }).fill("رضا");
  55 |   await page.getByLabel("نام خانوادگی").fill("کریمی");
  56 |   await page.getByRole("button", { name: "ادامه" }).click();
  57 |   await expect(page).toHaveURL(/\/account/);
  58 | 
  59 |   await page.getByRole("combobox", { name: "روز تولد" }).selectOption("21");
  60 |   await page.getByRole("combobox", { name: "ماه تولد" }).selectOption("5");
  61 |   await page.getByRole("combobox", { name: "سال تولد" }).selectOption("1378");
  62 |   await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  63 |   await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();
  64 |   await expect(page.getByText("تاریخ انتخابی: ۲۱ مرداد ۱۳۷۸")).toBeVisible();
  65 | 
  66 |   await page.reload();
  67 |   await expect(page.getByRole("combobox", { name: "روز تولد" })).toHaveValue("21");
  68 |   await expect(page.getByRole("combobox", { name: "ماه تولد" })).toHaveValue("5");
  69 |   await expect(page.getByRole("combobox", { name: "سال تولد" })).toHaveValue("1378");
  70 |   await expect(page.getByText("تاریخ انتخابی: ۲۱ مرداد ۱۳۷۸")).toBeVisible();
  71 | });
  72 | 
```