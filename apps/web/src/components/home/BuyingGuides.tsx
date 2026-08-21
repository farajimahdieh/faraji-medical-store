import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { guides } from "@/data/guides";

export function BuyingGuides() {
  return (
    <section className="bg-neutral-bg py-14">
      <Container>
        <SectionHeading title="راهنمای انتخاب تجهیزات پزشکی" />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md"
            >
              <div className="flex aspect-video items-center justify-center bg-medical-bg">
                <BookOpen className="h-9 w-9 text-primary/40" aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs font-medium text-primary">{guide.category}</span>
                <h3 className="text-base leading-7 font-bold text-navy">{guide.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-xs text-secondary-text">{guide.readingMinutes} دقیقه مطالعه</span>
                  <ArrowLeft
                    className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
