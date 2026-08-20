

* [x] **۱. معماری کلی پروژه**

  * Architecture: **Modular Monolith**
  * فعلاً Microservices نداریم.
  * Backend یک برنامه NestJS است، ولی داخل آن Moduleهای جدا داریم.
  * مثال Moduleها:

    * Auth
    * Users
    * Catalog / Products
    * Inventory
    * Cart
    * Orders
    * Payments
    * Shipping
    * Content
    * Accounting Integration
  * این تصمیم قبلاً در پروژه گرفته شده است.

* [x] **۲. Repository**

  * یک GitHub Repository
  * ساختار: **Monorepo**
  * مسیرها:

    * `apps/web` → Frontend
    * `apps/api` → Backend
    * `packages/*` → کد/type مشترک
  * Package manager: **pnpm workspace**
  * Repo برای portfolio به‌صورت Public در نظر گرفته شده است.

* [x] **۳. زبان اصلی**

  * TypeScript
  * هم Frontend و هم Backend
  * دلیل: هم قبلاً با آن کار کرده‌ای، هم بین Frontend/Backend context switching کمتر می‌شود.

* [x] **۴. Frontend**

  * React
  * Framework: **Next.js**
  * مسئول:

    * صفحات سایت
    * UI
    * فرم‌ها
    * نمایش محصولات
    * Cart UI
    * Checkout UI
    * پنل حساب کاربری
    * Admin UI
  * Business-critical logic مثل قیمت نهایی و تأیید پرداخت نباید فقط در Frontend باشد. این مرز قبلاً در معماری پروژه تعیین شده است.

* [x] **۵. Backend**

  * Runtime: Node.js
  * Framework: **NestJS**
  * Nest فعلاً از **Express adapter** استفاده می‌کند.
  * Backend مسئول:

    * authentication
    * authorization
    * قیمت واقعی
    * موجودی
    * سفارش
    * پرداخت
    * shipping
    * ارتباط با دیتابیس
  * Express و Nest دو Backend جدا نیستند.

* [x] **۶. API**

  * **REST API**
  * GraphQL فعلاً استفاده نمی‌شود.
  * Frontend از طریق API با Backend صحبت می‌کند.
  * مثال:

    * `GET /products`
    * `GET /products/:id`
    * `POST /cart`
    * `POST /orders`
  * REST قبلاً به‌عنوان تصمیم معماری ثبت شده است.

* [x] **۷. Database**

  * **PostgreSQL**
  * ORM: **TypeORM**
  * جداول اولیه احتمالی:

    * users
    * sessions
    * otp_codes
    * products
    * categories
    * product_images
    * inventory
    * carts
    * cart_items
    * orders
    * order_items
    * payments
    * addresses
  * Schema دقیق هر Feature فقط هنگام طراحی همان Feature نهایی شود؛ نه همه از الان.

* [x] **۸. Docker / محیط توسعه**

  * Docker Desktop نصب شود.
  * WSL2 روی Windows آماده شود.
  * PostgreSQL Development داخل Docker Compose اجرا شود.
  * هدف:

    * دیتابیس local قابل تکرار
    * setup ساده
    * نزدیک‌تر شدن development به deployment
  * در بررسی قبلی پروژه، Docker و WSL هنوز نصب نبودند.
  * **این یکی را قبل از شروع جدی Auth انجام بده.**

* [x] **۹. Authentication — تصمیم معماری**

  * ورود با شماره موبایل
  * OTP
  * Password-based auth نسازیم که بعداً دور ریخته شود.
  * فعلاً ارسال SMS را Mock کنیم.
  * یعنی Backend OTP واقعی تولید/verify می‌کند، ولی به‌جای SMS واقعی در Development کد را به Mock provider می‌دهد.
  * این دقیقاً همان Feature Plan فعلی پروژه است.

* [x] **۱۰. Session**

  * انتخاب پیشنهادی فعلی: **Opaque Session Token**
  * نه JWT به‌عنوان session اصلی.
  * هر login → یک Session مستقل.
  * Session شامل:

    * userId
    * tokenHash
    * expiresAt
    * createdAt
  * خود token خام داخل DB ذخیره نشود؛ hash آن ذخیره شود.
  * token خام در مرورگر داخل Cookie قرار گیرد.
  * موبایل و لپ‌تاپ یک کاربر → دو Session جدا.
  * Logout → همان Session باطل شود.
  * Logout all devices → همه Sessionهای user حذف شوند.

* [x] **۱۱. Cookie**

  * Session token داخل Cookie
  * Production:

    * `HttpOnly`
    * `Secure`
    * `SameSite`
    * expiration مشخص
  * Frontend نباید token را مثل داده معمولی دستکاری کند.
  * CSRF protection هنگام طراحی نهایی Auth بررسی شود.

* [x] **۱۲. OTP SMS Provider**

  * در فاز Development: **MockSmsProvider**
  * قبل از Production یکی انتخاب شود.
  * shortlist:

    * Kavenegar
    * MeliPayamak
  * کاوه‌نگار در حال حاضر API مخصوص verification/OTP دارد.
  * ملی‌پیامک نیز REST API و سرویس ارسال بر اساس pattern ارائه می‌کند.
  * معیار مقایسه:

    * سرعت رسیدن OTP
    * هزینه
    * documentation
    * Node.js support
    * blacklist delivery
    * uptime
    * پشتیبانی
  * **الان خریدش نکن.**
  * اول Auth با Mock کامل شود.

* [ ] **۱۳. Payment Architecture**

  * interface:

    * `PaymentProvider`
  * Development:

    * `MockPaymentProvider`
  * Backend باید:

    * payment ایجاد کند
    * کاربر را redirect کند
    * callback بگیرد
    * تراکنش را server-to-server verify کند
  * هیچ‌وقت «موفقیت پرداخت» صرفاً از Frontend قبول نشود.

* [ ] **۱۴. انتخاب درگاه پرداخت**

  * shortlist اولیه:

    * **Zarinpal**
    * **IDPay**
    * **NextPay**
  * زرین‌پال documentation رسمی برای Payment Gateway دارد و جریان ایجاد درخواست → redirect → verification را مستند کرده است.
  * IDPay نیز REST API رسمی برای اتصال درگاه ارائه می‌کند.
  * NextPay نیز API و جریان create token → بانک → callback → verification را مستند کرده است.
  * قبل از انتخاب نهایی مقایسه کن:

    * شرایط پذیرندگی
    * مدارک لازم
    * کارمزد
    * settlement
    * refund
    * کیفیت API
    * Sandbox/Test
    * پشتیبانی
    * محدودیت محصولات تجهیزات پزشکی
  * **پیشنهاد من:** فعلاً provider نهایی را انتخاب نکن؛ PaymentProvider abstraction + Mock را بساز، سپس درست قبل از اتصال Production مقایسه نهایی انجام بده.

* [ ] **۱۵. Product Catalog**

  * Product:

    * name
    * slug
    * description
    * price
    * status
    * category
    * images
    * specifications
  * برای تجهیزات پزشکی specifications باید flexible طراحی شود.
  * فعلاً Pricing module جدا نسازیم.
  * قیمت داخل Catalog باقی بماند تا زمانی که واقعاً wholesale/tiered pricing ایجاد شود. این تصمیم قبلاً در پروژه ثبت شده است.

* [ ] **۱۶. Inventory**

  * نسخه اول:

    * stock quantity
    * availability
  * Backend منبع تصمیم موجودی باشد.
  * بعداً:

    * stock reservation
    * atomic stock update
    * order expiration
    * reconciliation
    * audit log
  * از روز اول همه این‌ها را نساز؛ over-engineering می‌شود.

* [ ] **۱۷. Cart**

  * فقط کاربر login‌شده امکان خرید نهایی داشته باشد.
  * Cart می‌تواند قبل از checkout دوباره:

    * قیمت
    * موجودی
    * وضعیت محصول
      را از Backend verify کند.
  * هیچ priceای که Frontend ارسال می‌کند قابل اعتماد نباشد.

* [ ] **۱۸. Order**

  * statusهای اولیه را قبل از implementation مشخص کن.
  * مثال ذهنی:

    * pending_payment
    * paid
    * processing
    * shipped
    * delivered
    * cancelled
  * State transitionها باید Backend-controlled باشند.

* [ ] **۱۹. Checkout**

  * انتخاب/ثبت آدرس
  * بررسی موجودی
  * محاسبه مبلغ در Backend
  * محاسبه shipping
  * ایجاد Order
  * ایجاد Payment
  * redirect به Gateway
  * callback
  * server-side verify
  * paid کردن Order

* [ ] **۲۰. Shipping**

  * interface:

    * `ShippingProvider`
  * گزینه‌های احتمالی:

    * پست
    * تیپاکس
    * ارسال داخل تبریز
  * نسخه اول حتی می‌تواند shipping rule ساده داشته باشد.
  * API provider واقعی فقط وقتی انتخاب شود که روش واقعی ارسال فروشگاه مشخص باشد.

* [ ] **۲۱. Accounting Integration**

  * الان هیچ APIای را حدس نزن.
  * ابتدا مشخص کن فروشگاه دقیقاً از چه نرم‌افزار حسابداری استفاده می‌کند.
  * documentation API آن گرفته شود.
  * interface داخلی مثل:

    * `AccountingProvider`
  * Development:

    * Mock adapter
  * بعداً sync:

    * inventory
    * prices
    * orders
  * این integration از ابتدا به‌عنوان TBD در معماری پروژه ثبت شده است.

* [ ] **۲۲. Admin Panel**

  * داخل همان Next.js app
  * فعلاً app سوم نساز.
  * Admin بتواند:

    * Product مدیریت کند
    * stock ببیند/ویرایش کند
    * Orders مدیریت کند
    * Customers ببیند
    * Content سایت را مدیریت کند
  * Backend authorization واقعی لازم است؛ مخفی‌کردن دکمه در Frontend امنیت نیست.

* [ ] **۲۳. Role / Authorization**

  * حداقل:

    * customer
    * admin
  * بعداً:

    * wholesale
    * staff
  * authorization همیشه Backend.

* [ ] **۲۴. Content / Trust**

  * صفحه درباره ما
  * تماس با ما
  * آدرس واقعی
  * تلفن واقعی
  * ساعات کاری
  * عکس واقعی فروشگاه
  * شرایط ارسال
  * قوانین مرجوعی
  * Privacy Policy
  * Terms
  * هیچ اطلاعات ساختگی Production نباشد.
  * Trust-building از ابتدا requirement اصلی پروژه بوده است.

* [ ] **۲۵. تصاویر محصولات**

  * تصمیم بگیر تصاویر کجا ذخیره شوند.
  * Production بهتر است مستقیماً داخل Git repo نباشند.
  * گزینه‌ها بعداً:

    * Object Storage ایرانی
    * storage سرور
    * CDN/Object storage دیگر
  * برای MVP می‌توان ساده شروع کرد، اما abstraction آپلود را خیلی پیچیده نکن.

* [ ] **۲۶. Domain**

  * بررسی مالکیت دامنه‌ای که قبلاً برای فروشگاه گرفته‌ای.
  * login پنل registrar را پیدا کن.
  * expiration domain را بررسی کن.
  * مشخص کن:

    * `.ir`
    * `.com`
    * یا هر دو
  * اگر هر دو در اختیار هستند، یکی primary و دیگری redirect.
  * تصمیم نهایی دامنه مانع شروع کدنویسی نیست.

* [ ] **۲۷. Hosting**

  * این را قبل از Production لازم داریم، نه قبل از Auth.
  * دو مسیر:

    * Managed platform
    * VPS
  * برای یادگیری و سرعت، Managed hosting معمولاً setup ساده‌تری دارد.
  * مثلاً لیارا در حال حاضر Node.js hosting و PostgreSQL DBaaS دارد.
  * VPS کنترل بیشتری می‌دهد ولی مسئولیت Linux، updates، firewall، Nginx، backups و deployment بیشتر روی خودت می‌افتد.
  * **فعلاً انتخاب نهایی نکن.**

* [ ] **۲۸. DNS**

  * بعد از Hosting:

    * Domain → DNS
    * DNS → IP/Host
  * رکوردهایی مثل A/CNAME همان موقع یاد گرفته و تنظیم شوند.
  * الان blocker کدنویسی نیست.

* [ ] **۲۹. HTTPS / SSL**

  * Production حتماً HTTPS.
  * certificate و renewal ترجیحاً خودکار.
  * session cookie در Production با `Secure`.
  * این مرحله هنگام Deployment انجام شود.

* [ ] **۳۰. Reverse Proxy / Nginx**

  * الان الزامی نیست.
  * اگر VPS انتخاب کردی احتمالاً Nginx جلوی Next/Nest قرار می‌گیرد.
  * اگر Managed hosting انتخاب شود ممکن است platform این قسمت را خودش مدیریت کند.
  * پس قبل از انتخاب Hosting وقت زیادی روی Nginx نگذار.

* [ ] **۳۱. Security Baseline**

  * input validation
  * authorization
  * password نداریم → OTP security
  * OTP expiration
  * OTP attempt limit
  * OTP request cooldown
  * rate limiting
  * secure cookies
  * CSRF بررسی شود
  * XSS
  * SQL Injection
  * IDOR
  * price manipulation
  * order manipulation
  * payment manipulation
  * inventory manipulation
  * secrets هیچ‌وقت در GitHub

* [x] **۳۲. Secrets**

  * `.env` → commit نشود.
  * `.env.example` → commit شود.
  * API key
  * DB password
  * SMS key
  * Payment merchant/API key
  * Session secrets
  * production credentials
  * هیچ‌کدام وارد Git history نشوند.

* [ ] **۳۳. Testing**

  * Testing را آخر پروژه نگذار.
  * هر Feature همراه خودش test داشته باشد.
  * Backend:

    * unit
    * integration
    * e2e برای flowهای مهم
  * Auth:

    * OTP valid
    * OTP invalid
    * expired OTP
    * cooldown
    * session
    * logout
  * Payment:

    * failed callback
    * duplicate callback
    * invalid amount
    * successful verification

* [ ] **۳۴. Logging**

  * Development logging
  * Production structured logging
  * log کردن:

    * error
    * payment failures
    * suspicious auth attempts
  * هیچ OTP/token/API secret کامل داخل log نباشد.

* [ ] **۳۵. Backup**

  * PostgreSQL backup
  * تست restore
  * backup تصاویر
  * قبل از Production الزامی.
  * داشتن backup بدون اینکه Restore را تست کرده باشی کافی نیست.

* [ ] **۳۶. Monitoring**

  * بعد از Deploy:

    * uptime
    * CPU/RAM
    * application errors
    * failed payments
    * database health
  * Redis/complex observability از اول لازم نیست.

* [ ] **۳۷. SEO**

  * Product metadata
  * title/description
  * sitemap
  * robots.txt
  * canonical
  * structured data در صورت نیاز
  * URLهای قابل خواندن
  * Next.js برای صفحات public استفاده شود.

* [ ] **۳۸. Performance**

  * قبل از optimization اندازه‌گیری کن.
  * DB indexهای لازم
  * pagination
  * image optimization
  * caching فقط جایی که واقعاً لازم شد
  * Redis را از روز اول اضافه نکن.

* [ ] **۳۹. Git Workflow**

  * main
  * feature branch برای feature بزرگ
  * commitهای کوچک
  * Conventional Commits
  * نمونه:

    * `feat(api): add otp authentication`
    * `feat(web): add login flow`
    * `test(api): add auth e2e tests`
  * Agent نباید بدون اجازه تو commit/push کند.

* [ ] **۴۰. روش همکاری با Coding Agent**

  * قبل هر Feature:

    * Goal
    * Requirements
    * Architecture
    * Data Model
    * API
    * Frontend
    * Security
    * Edge cases
    * Tests
    * Files
  * بعد Plan، اول خودت بفهم.
  * بعد Agent implement کند.
  * کدی که نمی‌فهمی Accept نکن.
  * این workflow از ابتدا جزو قواعد پروژه بوده است.

* [ ] **۴۱. ترتیب پیشنهادی Implementation**

  * Docker + PostgreSQL local
  * Database connection / migration
  * Users
  * OTP Authentication Backend
  * Login Frontend
  * Session/Auth state
  * Product Catalog Backend
  * Product pages Frontend
  * Admin Product management
  * Inventory
  * Cart
  * Checkout
  * Orders
  * Mock Payment
  * Real Payment
  * Shipping
  * Content/Trust pages
  * Security hardening
  * Deployment
  * Domain/DNS/HTTPS
  * Production testing
  * Launch

* [ ] **۴۲. چیزهایی که قبل از خرید اشتراک Coding Agent واقعاً باید تمام کنی**

  * معماری کلی ✅
  * Stack ✅
  * Git/Repo ✅
  * Backend/Frontend boundary ✅
  * REST ✅
  * DB ✅
  * Auth strategy ✅
  * Session strategy ✅
  * Docker/WSL نصب شود
  * PostgreSQL local قابل اجرا باشد
  * Requirements واقعی فروشگاه جمع شود:

    * محصولات
    * دسته‌بندی‌ها
    * روش قیمت‌گذاری
    * روش ارسال
    * اطلاعات واقعی فروشگاه
    * نرم‌افزار حسابداری مورد استفاده
  * بعد **Coding Agent را فعال کن و مستقیم وارد implementation شو.**

---

## تصمیم نهایی پیشنهادی من قبل از شروع کدنویسی جدی

**Next.js + NestJS/Express + TypeScript + PostgreSQL + TypeORM + REST + pnpm Monorepo + Modular Monolith + OTP + Opaque Session در HttpOnly Cookie + Docker برای Development.**

Payment، SMS، Shipping، Accounting و Hosting را **از الان نهایی نکن**. برایشان interface و mock داشته باش و provider واقعی را نزدیک زمانی انتخاب کن که واقعاً integration آن Feature شروع می‌شود.

این کار جلوی دو نوع اتلاف وقت را می‌گیرد: هم اینکه ۱۰ روز قبل از کدنویسی درباره چیزهایی تحقیق کنی که هنوز نیازشان نداری، هم اینکه بدون تصمیم‌های بنیادی وارد Agent شوی و وسط پروژه مجبور به بازنویسی معماری بشوی.
