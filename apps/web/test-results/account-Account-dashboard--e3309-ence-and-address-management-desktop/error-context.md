# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account.spec.ts >> Account dashboard >> profile edit, birth date persistence, and address management
- Location: e2e\account.spec.ts:27:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#account-birth-date')

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - banner [ref=f1e2]:
    - generic [ref=f1e3]:
      - link "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی تجهیزات پزشکی و آزمایشگاهی فرجی Faraji Medical / Laboratory Equipment" [ref=f1e4] [cursor=pointer]:
        - /url: /
        - img "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی" [ref=f1e6]
        - generic [ref=f1e7]:
          - generic [ref=f1e8]: تجهیزات پزشکی و آزمایشگاهی فرجی
          - generic [ref=f1e9]: Faraji Medical / Laboratory Equipment
      - search [ref=f1e11]:
        - combobox "جستجو در محصولات" [ref=f1e12]
      - generic [ref=f1e13]:
        - link "حساب کاربری" [ref=f1e15] [cursor=pointer]:
          - /url: /account
        - link "علاقه‌مندی‌ها" [ref=f1e20] [cursor=pointer]:
          - /url: /wishlist
        - link "سبد خرید" [ref=f1e24] [cursor=pointer]:
          - /url: /cart
    - generic [ref=f1e30]:
      - button "دسته‌بندی‌ها" [ref=f1e32]
      - link "محصولات" [ref=f1e35] [cursor=pointer]:
        - /url: /products
      - link "راهنمای خرید" [ref=f1e36] [cursor=pointer]:
        - /url: /guides
      - link "مشاوره هوشمند" [ref=f1e37] [cursor=pointer]:
        - /url: /consultation
      - link "درباره ما" [ref=f1e38] [cursor=pointer]:
        - /url: /about
      - link "تماس با ما" [ref=f1e39] [cursor=pointer]:
        - /url: /contact
  - main [ref=f1e40]:
    - generic [ref=f1e41]:
      - generic [ref=f1e42]:
        - heading "سلام، علی‌رضا" [level=1] [ref=f1e43]
        - button "خروج از حساب" [ref=f1e44]
      - generic [ref=f1e45]:
        - navigation "ناوبری حساب کاربری" [ref=f1e46]:
          - button "اطلاعات حساب" [ref=f1e47]
          - button "آدرس‌های من" [ref=f1e51]
          - button "کدهای تخفیف من" [ref=f1e55]
          - link "علاقه‌مندی‌ها" [ref=f1e58] [cursor=pointer]:
            - /url: /wishlist
        - generic [ref=f1e63]:
          - heading "اطلاعات حساب" [level=2] [ref=f1e64]
          - generic [ref=f1e65]:
            - generic [ref=f1e66]:
              - generic [ref=f1e67]:
                - generic [ref=f1e68]:
                  - text: نام
                  - generic [ref=f1e69]: "*"
                - textbox "نام" [ref=f1e70]: علی‌رضا
              - generic [ref=f1e71]:
                - generic [ref=f1e72]:
                  - text: نام خانوادگی
                  - generic [ref=f1e73]: "*"
                - textbox "نام خانوادگی" [ref=f1e74]: رضایی
            - generic [ref=f1e75]:
              - generic [ref=f1e76]: شماره موبایل
              - textbox "شماره موبایل" [ref=f1e77]: "+989633782286"
              - paragraph [ref=f1e78]: شماره موبایل حساب شما
            - generic [ref=f1e79]:
              - group "تاریخ تولد (اختیاری)" [ref=f1e80]:
                - generic [ref=f1e82]:
                  - combobox "روز تولد" [ref=f1e83]:
                    - option "روز" [selected]
                    - option "۱"
                    - option "۲"
                    - option "۳"
                    - option "۴"
                    - option "۵"
                    - option "۶"
                    - option "۷"
                    - option "۸"
                    - option "۹"
                    - option "۱۰"
                    - option "۱۱"
                    - option "۱۲"
                    - option "۱۳"
                    - option "۱۴"
                    - option "۱۵"
                    - option "۱۶"
                    - option "۱۷"
                    - option "۱۸"
                    - option "۱۹"
                    - option "۲۰"
                    - option "۲۱"
                    - option "۲۲"
                    - option "۲۳"
                    - option "۲۴"
                    - option "۲۵"
                    - option "۲۶"
                    - option "۲۷"
                    - option "۲۸"
                    - option "۲۹"
                    - option "۳۰"
                    - option "۳۱"
                  - combobox "ماه تولد" [ref=f1e84]:
                    - option "ماه" [selected]
                    - option "فروردین"
                    - option "اردیبهشت"
                    - option "خرداد"
                    - option "تیر"
                    - option "مرداد"
                    - option "شهریور"
                    - option "مهر"
                    - option "آبان"
                    - option "آذر"
                    - option "دی"
                    - option "بهمن"
                    - option "اسفند"
                  - combobox "سال تولد" [ref=f1e85]:
                    - option "سال" [selected]
                    - option "۱۴۰۵"
                    - option "۱۴۰۴"
                    - option "۱۴۰۳"
                    - option "۱۴۰۲"
                    - option "۱۴۰۱"
                    - option "۱۴۰۰"
                    - option "۱۳۹۹"
                    - option "۱۳۹۸"
                    - option "۱۳۹۷"
                    - option "۱۳۹۶"
                    - option "۱۳۹۵"
                    - option "۱۳۹۴"
                    - option "۱۳۹۳"
                    - option "۱۳۹۲"
                    - option "۱۳۹۱"
                    - option "۱۳۹۰"
                    - option "۱۳۸۹"
                    - option "۱۳۸۸"
                    - option "۱۳۸۷"
                    - option "۱۳۸۶"
                    - option "۱۳۸۵"
                    - option "۱۳۸۴"
                    - option "۱۳۸۳"
                    - option "۱۳۸۲"
                    - option "۱۳۸۱"
                    - option "۱۳۸۰"
                    - option "۱۳۷۹"
                    - option "۱۳۷۸"
                    - option "۱۳۷۷"
                    - option "۱۳۷۶"
                    - option "۱۳۷۵"
                    - option "۱۳۷۴"
                    - option "۱۳۷۳"
                    - option "۱۳۷۲"
                    - option "۱۳۷۱"
                    - option "۱۳۷۰"
                    - option "۱۳۶۹"
                    - option "۱۳۶۸"
                    - option "۱۳۶۷"
                    - option "۱۳۶۶"
                    - option "۱۳۶۵"
                    - option "۱۳۶۴"
                    - option "۱۳۶۳"
                    - option "۱۳۶۲"
                    - option "۱۳۶۱"
                    - option "۱۳۶۰"
                    - option "۱۳۵۹"
                    - option "۱۳۵۸"
                    - option "۱۳۵۷"
                    - option "۱۳۵۶"
                    - option "۱۳۵۵"
                    - option "۱۳۵۴"
                    - option "۱۳۵۳"
                    - option "۱۳۵۲"
                    - option "۱۳۵۱"
                    - option "۱۳۵۰"
                    - option "۱۳۴۹"
                    - option "۱۳۴۸"
                    - option "۱۳۴۷"
                    - option "۱۳۴۶"
                    - option "۱۳۴۵"
                    - option "۱۳۴۴"
                    - option "۱۳۴۳"
                    - option "۱۳۴۲"
                    - option "۱۳۴۱"
                    - option "۱۳۴۰"
                    - option "۱۳۳۹"
                    - option "۱۳۳۸"
                    - option "۱۳۳۷"
                    - option "۱۳۳۶"
                    - option "۱۳۳۵"
                    - option "۱۳۳۴"
                    - option "۱۳۳۳"
                    - option "۱۳۳۲"
                    - option "۱۳۳۱"
                    - option "۱۳۳۰"
                    - option "۱۳۲۹"
                    - option "۱۳۲۸"
                    - option "۱۳۲۷"
                    - option "۱۳۲۶"
                    - option "۱۳۲۵"
                    - option "۱۳۲۴"
                    - option "۱۳۲۳"
                    - option "۱۳۲۲"
                    - option "۱۳۲۱"
                    - option "۱۳۲۰"
                    - option "۱۳۱۹"
                    - option "۱۳۱۸"
                    - option "۱۳۱۷"
                    - option "۱۳۱۶"
                    - option "۱۳۱۵"
                    - option "۱۳۱۴"
                    - option "۱۳۱۳"
                    - option "۱۳۱۲"
                    - option "۱۳۱۱"
                    - option "۱۳۱۰"
                    - option "۱۳۰۹"
                    - option "۱۳۰۸"
                    - option "۱۳۰۷"
                    - option "۱۳۰۶"
                    - option "۱۳۰۵"
                - paragraph [ref=f1e86]: اختیاریه؛ شاید یه روز بهونه‌ای شد برای یه هدیه کوچیک 🎁
              - paragraph [ref=f1e87]: ثبت تاریخ تولد اختیاری است و ممکن است در آینده برای هدیه‌ها و پیشنهادهای مناسبتی استفاده شود.
            - button "ذخیره تغییرات" [disabled] [ref=f1e89]
  - contentinfo [ref=f1e90]:
    - generic [ref=f1e91]:
      - generic [ref=f1e92]:
        - generic [ref=f1e93]:
          - img "لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی" [ref=f1e95]
          - generic [ref=f1e96]:
            - generic [ref=f1e97]: تجهیزات پزشکی و آزمایشگاهی فرجی
            - generic [ref=f1e98]: Faraji Medical / Laboratory Equipment
        - paragraph [ref=f1e99]: بیش از ۱۵ سال تجربه فروش حضوری در تبریز، همراه شما برای انتخاب مطمئن
      - generic [ref=f1e100]:
        - heading "دسته‌بندی‌ها" [level=3] [ref=f1e101]
        - list [ref=f1e102]:
          - listitem [ref=f1e103]:
            - link "پانسمان و زخم بستر" [ref=f1e104] [cursor=pointer]:
              - /url: /categories/dressing-wound-care
          - listitem [ref=f1e105]:
            - link "تجهیزات مصرفی پزشکی" [ref=f1e106] [cursor=pointer]:
              - /url: /categories/medical-consumables
          - listitem [ref=f1e107]:
            - link "تجهیزات ارتوپدی" [ref=f1e108] [cursor=pointer]:
              - /url: /categories/orthopedic-mobility-rehab
          - listitem [ref=f1e109]:
            - link "تجهیزات تنفسی" [ref=f1e110] [cursor=pointer]:
              - /url: /categories/diagnostics-respiratory
          - listitem [ref=f1e111]:
            - link "تجهیزات آزمایشگاهی" [ref=f1e112] [cursor=pointer]:
              - /url: /categories/lab-equipment
      - generic [ref=f1e113]:
        - heading "لینک‌های سریع" [level=3] [ref=f1e114]
        - list [ref=f1e115]:
          - listitem [ref=f1e116]:
            - link "درباره ما" [ref=f1e117] [cursor=pointer]:
              - /url: /about
          - listitem [ref=f1e118]:
            - link "راهنمای خرید" [ref=f1e119] [cursor=pointer]:
              - /url: /guides
          - listitem [ref=f1e120]:
            - link "سوالات متداول" [ref=f1e121] [cursor=pointer]:
              - /url: /faq
          - listitem [ref=f1e122]:
            - link "شرایط و قوانین" [ref=f1e123] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=f1e124]:
            - link "حریم خصوصی" [ref=f1e125] [cursor=pointer]:
              - /url: /privacy
          - listitem [ref=f1e126]:
            - link "پیگیری سفارش" [ref=f1e127] [cursor=pointer]:
              - /url: /orders/track
      - generic [ref=f1e128]:
        - heading "تماس با ما" [level=3] [ref=f1e129]
        - generic [ref=f1e130]: تبریز، خیابان ارتش جنوبی، نرسیده به بیمارستان بهبود، جنب مجتمع خدماتی ماهان، پلاک ۶
        - generic [ref=f1e135]: 041-35573134
        - generic [ref=f1e139]: 0914 453 7073
        - generic [ref=f1e143]: gholamrezafaraji50@gmail.com
        - generic [ref=f1e148]:
          - link "اینستاگرام faraji.medical" [ref=f1e149] [cursor=pointer]:
            - /url: "#"
          - link "تلگرام faraji.medical" [ref=f1e153] [cursor=pointer]:
            - /url: "#"
          - generic [ref=f1e157]: "@faraji.medical"
    - paragraph [ref=f1e160]: © 2026 تجهیزات پزشکی و آزمایشگاهی فرجی. تمامی حقوق محفوظ است.
  - status
  - button "Open Next.js Dev Tools" [ref=f1e166] [cursor=pointer]
  - alert [ref=f1e170]
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
  13  |   await expect(page.getByText(`کد ۶ رقمی برای ${phone} ارسال شد.`)).toBeVisible();
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
> 50  |     await birthDateInput.fill("1990-05-12");
      |                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  114 |     await expect(page.getByText("آدرس پیش‌فرض")).toHaveCount(1);
  115 | 
  116 |     // --- Coupons section renders without crashing ---
  117 |     await page.getByRole("button", { name: "کدهای تخفیف من" }).click();
  118 |     await expect(page.getByText("فعلاً کد تخفیفی برای حساب شما فعال نیست")).toBeVisible();
  119 | 
  120 |     // --- Wishlist link present in the account nav (scoped away from the
  121 |     // site header's own wishlist icon, which shares the same accessible name) ---
  122 |     await expect(
  123 |       page
  124 |         .getByRole("navigation", { name: "ناوبری حساب کاربری" })
  125 |         .getByRole("link", { name: /علاقه‌مندی‌ها/ }),
  126 |     ).toHaveAttribute("href", "/wishlist");
  127 |   });
  128 | 
  129 |   test("mobile viewport: no horizontal overflow, RTL, direct tab navigation", async ({ page }) => {
  130 |     await page.setViewportSize({ width: 390, height: 844 });
  131 |     const phone = randomPhone();
  132 |     await loginNewUser(page, phone);
  133 | 
  134 |     await expect(page).toHaveURL(/\/complete-profile/);
  135 |     await page.getByLabel("نام", { exact: true }).fill("مریم");
  136 |     await page.getByLabel("نام خانوادگی").fill("احمدی");
  137 |     await page.getByRole("button", { name: "ادامه" }).click();
  138 |     await expect(page).toHaveURL(/\/account/);
  139 | 
  140 |     const dir = await page.evaluate(() => document.documentElement.dir);
  141 |     expect(dir).toBe("rtl");
  142 | 
  143 |     const hasOverflow = await page.evaluate(
  144 |       () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  145 |     );
  146 |     expect(hasOverflow).toBe(false);
  147 | 
  148 |     // Mobile nav tabs are tappable and switch sections directly (no hover simulation).
  149 |     await page.getByRole("button", { name: "آدرس‌های من" }).click();
  150 |     await expect(page.getByText("هنوز آدرسی ثبت نکرده‌اید")).toBeVisible();
```