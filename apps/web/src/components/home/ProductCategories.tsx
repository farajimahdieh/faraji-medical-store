import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories } from "@/data/categories";

// Subtle, rotating per-card tint so the 8 categories are easier to tell
// apart at a glance, without turning the grid into a rainbow.
const tints = [
  { bg: "bg-tint-blue", icon: "text-primary" },
  { bg: "bg-tint-red", icon: "text-accent-red" },
  { bg: "bg-tint-orange", icon: "text-accent-orange" },
  { bg: "bg-tint-green", icon: "text-primary" },
];

export function ProductCategories() {
  return (
    <section className="py-14">
      <Container>
        <SectionHeading title="دسته‌بندی محصولات" subtitle="محصول مورد نیازتان را سریع‌تر پیدا کنید" />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const tint = tints[index % tints.length];
            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint.bg} ${tint.icon} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-navy">{category.name}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-secondary-text">{category.description}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
                  مشاهده محصولات
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
