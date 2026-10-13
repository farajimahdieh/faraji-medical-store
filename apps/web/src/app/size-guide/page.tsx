import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SizeGuideTable } from "@/components/catalog/SizeGuideTable";
import { sizeGuideSections } from "@/data/size-guide";
import { STORE_MOBILE, STORE_PHONE } from "@/data/store";

export const metadata: Metadata = {
  title: "راهنمای انتخاب سایز | تجهیزات پزشکی و آزمایشگاهی فرجی",
  description:
    "راهنمای انتخاب سایز کمربند طبی، گردنبند، زانوبند، مچ‌بند، قوزک‌بند و جوراب واریس: اندازه را با متر بگیرید و سایز مناسب را از جدول پیدا کنید.",
};

export default function SizeGuidePage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-navy">راهنمای انتخاب سایز</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary-text">
        اندازه‌ی بدن را با متر خیاطی بگیرید و با جدول همان محصول مقایسه کنید. اگر اندازه‌ی شما بین
        دو سایز بود یا مطمئن نبودید، با ما تماس بگیرید تا کمکتان کنیم: {STORE_PHONE} یا{" "}
        {STORE_MOBILE}.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="بخش‌های راهنمای سایز">
        {sizeGuideSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-border px-3 py-1 text-sm text-navy hover:border-primary hover:text-primary"
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {sizeGuideSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 rounded-xl border border-border bg-white p-5"
          >
            <h2 className="text-lg font-bold text-navy">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-secondary-text">{section.howToMeasure}</p>
            <div className="mt-3">
              <SizeGuideTable section={section} />
            </div>
            {section.rows.length === 0 && (
              <p className="mt-3 text-sm text-secondary-text">
                اندازه را بگیرید و به ما بگویید تا سایز مناسب را به شما معرفی کنیم.
              </p>
            )}
            {section.note && <p className="mt-3 text-xs text-secondary-text">{section.note}</p>}
          </section>
        ))}
      </div>
    </Container>
  );
}
