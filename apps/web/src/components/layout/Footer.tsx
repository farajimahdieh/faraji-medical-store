import { Send, Camera, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { Container } from "@/components/ui/Container";

const footerCategories = [
  { label: "پانسمان و زخم بستر", href: "/categories/dressing-wound-care" },
  { label: "تجهیزات مصرفی پزشکی", href: "/categories/medical-consumables" },
  { label: "تجهیزات ارتوپدی", href: "/categories/orthopedic-mobility-rehab" },
  { label: "تجهیزات تنفسی", href: "/categories/diagnostics-respiratory" },
  { label: "تجهیزات آزمایشگاهی", href: "/categories/lab-equipment" },
];

const quickLinks = [
  { label: "درباره ما", href: "/about" },
  { label: "راهنمای خرید", href: "/guides" },
  { label: "سوالات متداول", href: "/faq" },
  { label: "شرایط و قوانین", href: "/terms" },
  { label: "حریم خصوصی", href: "/privacy" },
  { label: "پیگیری سفارش", href: "/orders/track" },
];

export function Footer() {
  return (
    <footer className="bg-navy">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">تجهیزات پزشکی و آزمایشگاهی فرجی</span>
              <span className="text-xs text-white/60">Faraji Medical / Laboratory Equipment</span>
            </div>
          </div>
          <p className="text-sm leading-6 text-white/70">
            بیش از ۱۵ سال تجربه فروش حضوری در تبریز، همراه شما برای انتخاب مطمئن
          </p>
        </div>

        <FooterColumn title="دسته‌بندی‌ها" links={footerCategories} />
        <FooterColumn title="لینک‌های سریع" links={quickLinks} />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">تماس با ما</h3>
          <div className="flex items-start gap-2 text-sm leading-6 text-white/70">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" aria-hidden="true" />
            <span>تبریز، خیابان ارتش جنوبی، نرسیده به بیمارستان بهبود، جنب مجتمع خدماتی ماهان، پلاک ۶</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70" dir="ltr">
            <Phone className="h-4 w-4 shrink-0 text-accent-red" aria-hidden="true" />
            <span>041-35573134</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70" dir="ltr">
            <Phone className="h-4 w-4 shrink-0 text-accent-red" aria-hidden="true" />
            <span>0914 453 7073</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70" dir="ltr">
            <Mail className="h-4 w-4 shrink-0 text-accent-red" aria-hidden="true" />
            <span>gholamrezafaraji50@gmail.com</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href="#"
              aria-label="اینستاگرام faraji.medical"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/70 transition-colors hover:border-accent-red hover:text-accent-red"
            >
              <Camera className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
            <a
              href="#"
              aria-label="تلگرام faraji.medical"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/70 transition-colors hover:border-accent-red hover:text-accent-red"
            >
              <Send className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
            <span className="text-xs text-white/50" dir="ltr">
              @faraji.medical
            </span>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10 py-5">
        <Container>
          <p className="text-center text-xs text-white/50">
            © {new Date().getFullYear()} تجهیزات پزشکی و آزمایشگاهی فرجی. تمامی حقوق محفوظ است.
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-accent-red">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
