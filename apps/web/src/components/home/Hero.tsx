import { Accessibility, Activity, ArrowLeft, FlaskConical, MessageCircle, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-medical-bg to-white py-10 sm:py-14">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 rounded-[28px] border border-border bg-medical-bg/60 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div className="flex flex-col items-start gap-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-orange" aria-hidden="true" />
              تجهیزات پزشکی و آزمایشگاهی فرجی
            </p>

            <h1 className="text-[34px] leading-[1.25] font-bold text-navy sm:text-[44px] lg:text-[50px]">
              انتخاب مطمئن تجهیزات پزشکی و آزمایشگاهی
            </h1>

            <p className="text-base leading-8 text-secondary-text sm:text-lg">
              بیش از ۱۵ سال تجربه فروش حضوری در تبریز، همراه با مشاوره صادقانه پیش از خرید
            </p>

            <p className="text-base font-semibold text-navy">
              برای ما، انتخاب درست شما مهم‌تر از فروش است.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary-dark"
              >
                مشاهده محصولات
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/consultation"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-semibold text-navy transition-colors hover:border-accent-red/40 hover:text-accent-red"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                مشاوره خرید
              </Link>
            </div>

            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-accent-red px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">+۱۵ سال تجربه و اعتماد</p>
                <p className="text-xs text-white/80">فروش حضوری در تبریز</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto grid aspect-square w-full max-w-md grid-cols-2 gap-4">
            <HeroVisualTile icon={Stethoscope} className="translate-y-4" color="text-primary" />
            <HeroVisualTile icon={Activity} color="text-accent-red" />
            <HeroVisualTile icon={FlaskConical} color="text-accent-orange" />
            <HeroVisualTile icon={Accessibility} className="translate-y-4" color="text-primary" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroVisualTile({
  icon: Icon,
  className = "",
  color,
}: {
  icon: typeof Stethoscope;
  className?: string;
  color: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl border border-border bg-white shadow-sm ${className}`}
    >
      <Icon className={`h-12 w-12 ${color}`} strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}
