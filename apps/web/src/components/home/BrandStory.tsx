import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function BrandStory() {
  return (
    <section className="bg-warm-bg py-16">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 flex aspect-4/3 items-center justify-center rounded-[28px] border border-border bg-white lg:order-1">
          <span className="absolute top-6 left-6 h-3 w-3 rounded-full bg-accent-orange" aria-hidden="true" />
          <HeartHandshake className="h-20 w-20 text-accent-red/70" strokeWidth={1.2} aria-hidden="true" />
        </div>

        <div className="order-1 flex flex-col items-start gap-4 lg:order-2">
          <p className="text-sm font-semibold text-primary">داستان فرجی</p>
          <h2 className="text-[28px] font-bold text-navy sm:text-[32px]">اعتماد مردم، سرمایه ماست</h2>
          <span className="rounded-full border border-accent-red/25 bg-accent-red/5 px-4 py-1.5 text-xs font-semibold text-accent-red">
            +۱۵ سال تجربه حضوری در تبریز
          </span>
          <p className="text-base leading-8 text-secondary-text">
            فروشگاه فرجی بیش از ۱۵ سال است که به صورت حضوری در تبریز فعالیت می‌کند. از ابتدا هدف این مجموعه فقط
            فروش نبوده؛ مهم بوده که پیش از خرید، نیاز مشتری به‌درستی شناخته شود و مناسب‌ترین محصول به او پیشنهاد
            شود. همان صداقت و اعتمادی که طی سال‌ها در فروشگاه حضوری شکل گرفته، امروز در فضای آنلاین نیز ادامه پیدا
            می‌کند. برای ما، کمک به انتخاب درست مشتری مهم‌تر از فروش سریع است.
          </p>
          <Link
            href="/about"
            className="mt-2 flex h-11 items-center justify-center rounded-xl bg-navy px-6 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
          >
            آشنایی با داستان ما
          </Link>
        </div>
      </Container>
    </section>
  );
}
