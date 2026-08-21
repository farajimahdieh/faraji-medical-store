import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { featuredProducts } from "@/data/products";

export function FeaturedProducts() {
  return (
    <section className="py-14">
      <Container>
        <SectionHeading
          title="پرفروش‌ترین محصولات"
          action={{ label: "مشاهده همه محصولات", href: "/products" }}
        />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
