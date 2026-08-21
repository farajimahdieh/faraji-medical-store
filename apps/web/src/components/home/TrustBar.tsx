import { Container } from "@/components/ui/Container";
import { trustItems, type Accent } from "@/data/trust";

const accentClasses: Record<Accent, string> = {
  primary: "bg-tint-blue text-primary",
  red: "bg-tint-red text-accent-red",
  orange: "bg-tint-orange text-accent-orange",
};

export function TrustBar() {
  return (
    <section className="py-10">
      <Container className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses[item.accent]}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{item.title}</p>
                <p className="mt-0.5 text-xs text-secondary-text">{item.caption}</p>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
