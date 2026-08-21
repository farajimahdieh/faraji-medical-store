import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brandPlaceholders } from "@/data/brands";

export function Brands() {
  return (
    <section className="py-14">
      <Container>
        <SectionHeading title="برندهای معتبر" />

        <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {brandPlaceholders.map((brand) => (
            <div
              key={brand.id}
              className="flex h-20 items-center justify-center rounded-2xl border border-border bg-neutral-bg text-sm font-semibold text-secondary-text grayscale transition-all hover:grayscale-0 hover:border-primary/30 hover:text-primary"
            >
              {brand.label}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
