import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function ConsultationCTA() {
  return (
    <section className="pb-14">
      <Container>
        <div className="flex flex-col items-center gap-5 rounded-[28px] bg-navy px-6 py-14 text-center sm:px-14">
          <h2 className="text-[26px] font-bold text-white sm:text-[30px]">
            برای انتخاب محصول مطمئن نیستید؟
          </h2>
          <p className="text-base text-white/70">قبل از خرید با ما مشورت کنید.</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/consultation"
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              دریافت مشاوره
            </Link>
            <Link
              href="/consultation"
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              مشاوره هوشمند فرجی
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
