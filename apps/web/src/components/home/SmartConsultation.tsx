import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const previewQuestions = [
  "برای چه کسی خرید می‌کنید؟",
  "استفاده خانگی است یا حرفه‌ای؟",
  "چه بودجه‌ای در نظر دارید؟",
  "چه ویژگی‌هایی برایتان مهم است؟",
];

export function SmartConsultation() {
  return (
    <section className="py-14">
      <Container className="grid grid-cols-1 items-center gap-10 rounded-[28px] border border-border bg-neutral-bg p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
        <div className="flex flex-col items-start gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-[28px] font-bold text-navy sm:text-[32px]">مشاوره هوشمند فرجی</h2>
          <p className="text-base leading-7 text-secondary-text">
            برای انتخاب محصول مناسب، چند سؤال ساده را پاسخ دهید.
          </p>
          <Link
            href="/consultation"
            className="mt-2 flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            شروع مشاوره هوشمند
          </Link>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
          {previewQuestions.map((question) => (
            <div
              key={question}
              className="w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-medical-bg px-4 py-2.5 text-sm text-navy"
            >
              {question}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
