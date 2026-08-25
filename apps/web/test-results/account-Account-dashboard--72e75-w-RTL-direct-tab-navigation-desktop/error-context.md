# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account.spec.ts >> Account dashboard >> mobile viewport: no horizontal overflow, RTL, direct tab navigation
- Location: e2e\account.spec.ts:129:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('کد ۶ رقمی برای 09949623966 ارسال شد.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('کد ۶ رقمی برای 09949623966 ارسال شد.')

```

```yaml
- banner:
  - link "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی":
    - /url: /
    - img "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی"
  - link "حساب کاربری":
    - /url: /login?returnTo=%2Faccount
  - link "علاقه‌مندی‌ها":
    - /url: /wishlist
  - link "سبد خرید":
    - /url: /cart
  - button "باز کردن منو"
- main:
  - heading "ورود / ثبت‌نام" [level=1]
  - text: شماره موبایل
  - textbox "شماره موبایل":
    - /placeholder: 09xxxxxxxxx
    - text: "09949623966"
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
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { getOtpForPhone } from "./otp";
  3   | 
  4   | function randomPhone(): string {
  5   |   const suffix = Math.floor(100000000 + Math.random() * 900000000);
  6   |   return `09${suffix}`;
  7   | }
  8   | 
  9   | async function loginNewUser(page: Page, phone: string) {
  10  |   await page.goto("/login");
  11  |   await page.getByLabel("شماره موبایل").fill(phone);
  12  |   await page.getByRole("button", { name: "ارسال کد" }).click();
> 13  |   await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  14  | 
  15  |   const code = await getOtpForPhone(phone);
  16  |   await page.getByLabel("کد تایید").fill(code);
  17  |   await page.getByRole("button", { name: "تایید" }).click();
  18  | }
  19  | 
  20  | function addressCard(page: Page, title: string) {
  21  |   return page.locator("div.rounded-2xl.border.border-border.bg-white.p-5.shadow-sm", {
  22  |     hasText: title,
  23  |   });
  24  | }
  25  | 
  26  | test.describe("Account dashboard", () => {
  27  |   test("profile edit, birth date persistence, and address management", async ({ page }) => {
  28  |     const phone = randomPhone();
  29  |     await loginNewUser(page, phone);
  30  | 
  31  |     await expect(page).toHaveURL(/\/complete-profile/);
  32  |     await page.getByLabel("نام", { exact: true }).fill("علی");
  33  |     await page.getByLabel("نام خانوادگی").fill("رضایی");
  34  |     await page.getByRole("button", { name: "ادامه" }).click();
  35  | 
  36  |     await expect(page).toHaveURL(/\/account/);
  37  |     await expect(page.getByRole("heading", { name: "سلام، علی" })).toBeVisible();
  38  | 
  39  |     // --- Edit name and persist across reload ---
  40  |     const firstNameField = page.getByRole("textbox", { name: "نام", exact: true });
  41  |     await firstNameField.fill("علی‌رضا");
  42  |     await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  43  |     await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();
  44  | 
  45  |     await page.reload();
  46  |     await expect(page.getByRole("textbox", { name: "نام", exact: true })).toHaveValue("علی‌رضا");
  47  | 
  48  |     // --- Birth date: set, save, reload, verify exact day (no timezone shift) ---
  49  |     const birthDateInput = page.locator("#account-birth-date");
  50  |     await birthDateInput.fill("1990-05-12");
  51  |     await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  52  |     await expect(page.getByText("اطلاعات حساب شما ذخیره شد")).toBeVisible();
  53  | 
  54  |     await page.reload();
  55  |     await expect(page.locator("#account-birth-date")).toHaveValue("1990-05-12");
  56  | 
  57  |     // --- Addresses: add "خانه" (auto-default), add "محل کار", set it default ---
  58  |     await page.getByRole("button", { name: "آدرس‌های من" }).click();
  59  |     await page.getByRole("button", { name: "افزودن اولین آدرس" }).click();
  60  |     await expect(page.getByText("این آدرس به‌طور خودکار پیش‌فرض خواهد شد.")).toBeVisible();
  61  |     await page.getByRole("button", { name: "خانه", exact: true }).click();
  62  |     await page.getByRole("textbox", { name: "نام گیرنده" }).fill("علی‌رضا رضایی");
  63  |     await page.getByRole("textbox", { name: "شماره گیرنده" }).fill("09121110099");
  64  |     await page.getByRole("textbox", { name: "استان" }).fill("تهران");
  65  |     await page.getByRole("textbox", { name: "شهر" }).fill("تهران");
  66  |     await page.getByRole("textbox", { name: "آدرس کامل" }).fill("خیابان ولیعصر");
  67  |     await page.getByRole("textbox", { name: "کد پستی" }).fill("1234567890");
  68  |     await page.getByRole("button", { name: "افزودن آدرس", exact: true }).click();
  69  |     await expect(page.getByText("آدرس جدید اضافه شد")).toBeVisible();
  70  |     await expect(addressCard(page, "خانه").getByText("آدرس پیش‌فرض")).toBeVisible();
  71  | 
  72  |     await page.getByRole("button", { name: "افزودن آدرس جدید" }).click();
  73  |     await expect(page.getByText("انتخاب به‌عنوان آدرس پیش‌فرض")).toBeVisible();
  74  |     await page.getByRole("button", { name: "محل کار", exact: true }).click();
  75  |     await page.getByRole("textbox", { name: "نام گیرنده" }).fill("علی‌رضا رضایی");
  76  |     await page.getByRole("textbox", { name: "شماره گیرنده" }).fill("09121110099");
  77  |     await page.getByRole("textbox", { name: "استان" }).fill("تهران");
  78  |     await page.getByRole("textbox", { name: "شهر" }).fill("تهران");
  79  |     await page.getByRole("textbox", { name: "آدرس کامل" }).fill("خیابان انقلاب");
  80  |     await page.getByRole("textbox", { name: "کد پستی" }).fill("1234567891");
  81  |     await page.getByRole("button", { name: "افزودن آدرس", exact: true }).click();
  82  |     await expect(page.getByText("آدرس جدید اضافه شد")).toBeVisible();
  83  | 
  84  |     // Only "خانه" should be default right now
  85  |     await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);
  86  | 
  87  |     await addressCard(page, "محل کار")
  88  |       .getByRole("button", { name: "انتخاب به‌عنوان پیش‌فرض" })
  89  |       .click();
  90  |     await expect(page.getByText("آدرس پیش‌فرض تغییر کرد")).toBeVisible();
  91  |     await expect(addressCard(page, "محل کار").getByText("آدرس پیش‌فرض")).toBeVisible();
  92  |     await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);
  93  | 
  94  |     await page.reload();
  95  |     await page.getByRole("button", { name: "آدرس‌های من" }).click();
  96  |     await expect(addressCard(page, "محل کار").getByText("آدرس پیش‌فرض")).toBeVisible();
  97  |     await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);
  98  | 
  99  |     // --- Edit the "خانه" address ---
  100 |     await addressCard(page, "خانه").getByRole("button", { name: "ویرایش" }).click();
  101 |     const editNameField = page.getByRole("textbox", { name: "نام گیرنده" });
  102 |     await editNameField.fill("علی رضایی ویرایش‌شده");
  103 |     await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  104 |     await expect(page.getByText("آدرس ویرایش شد")).toBeVisible();
  105 |     await expect(page.getByText("علی رضایی ویرایش‌شده")).toBeVisible();
  106 | 
  107 |     // --- Delete the default address ("محل کار") -> another gets promoted ---
  108 |     await addressCard(page, "محل کار").getByRole("button", { name: "حذف" }).click();
  109 |     await expect(page.getByText("این آدرس حذف شود؟")).toBeVisible();
  110 |     await page.getByRole("button", { name: "بله، حذف شود" }).click();
  111 |     await expect(page.getByText("آدرس حذف شد")).toBeVisible();
  112 |     await expect(page.getByText("محل کار")).not.toBeVisible();
  113 |     await expect(addressCard(page, "خانه").getByText("آدرس پیش‌فرض")).toBeVisible();
```