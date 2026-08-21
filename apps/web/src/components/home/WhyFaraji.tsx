import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { whyFarajiItems } from "@/data/trust";

export function WhyFaraji() {
  return (
    <section className="py-14">
      <Container>
        <SectionHeading title="چرا فرجی؟" />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyFarajiItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-border p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-bg text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold text-navy">{item.title}</h3>
                <p className="text-sm leading-6 text-secondary-text">{item.caption}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
