import { Building2, HeartHandshake, Home, PersonStanding, Stethoscope, Wind } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { shopByNeedItems } from "@/data/navigation";

const icons = {
  "home-care": Home,
  "elderly-care": HeartHandshake,
  respiratory: Wind,
  mobility: PersonStanding,
  clinic: Stethoscope,
  laboratory: Building2,
} as const;

export function ShopByNeed() {
  return (
    <section className="bg-neutral-bg py-14">
      <Container>
        <div className="mb-8">
          <p className="text-sm font-medium text-secondary-text">نام محصول را نمی‌دانید؟ از نیازتان شروع کنید.</p>
          <h2 className="mt-2 text-[28px] font-bold text-navy sm:text-[32px]">خرید بر اساس نیاز شما</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {shopByNeedItems.map((item) => {
            const Icon = icons[item.slug as keyof typeof icons];
            return (
              <Link
                key={item.slug}
                href={`/need/${item.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-4 py-6 text-center transition-all hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-medical-bg text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-navy">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
