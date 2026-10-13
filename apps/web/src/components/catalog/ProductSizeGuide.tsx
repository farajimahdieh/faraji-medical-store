import Link from "next/link";
import { Ruler } from "lucide-react";
import { SizeGuideTable } from "@/components/catalog/SizeGuideTable";
import { findSizeGuideSection, hasSizeChoice } from "@/data/size-guide";

// Shown under the product photos for anything sold in sizes: the matching
// table from the size guide plus a link to the full guide page.
export function ProductSizeGuide({
  productName,
  sizes,
}: {
  productName: string;
  sizes: string[];
}) {
  if (!hasSizeChoice(sizes)) return null;
  const section = findSizeGuideSection(productName);
  const href = section ? `/size-guide#${section.id}` : "/size-guide";

  return (
    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy">
        <Ruler className="h-5 w-5 text-primary" aria-hidden />
        راهنمای انتخاب سایز
      </h2>
      {section && (
        <>
          <p className="mt-2 text-sm leading-7 text-secondary-text">{section.howToMeasure}</p>
          <div className="mt-3">
            <SizeGuideTable section={section} />
          </div>
        </>
      )}
      <Link href={href} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
        راهنمای کامل انتخاب سایز
      </Link>
    </section>
  );
}
