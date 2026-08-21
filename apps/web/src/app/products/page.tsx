import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Pagination } from "@/components/catalog/Pagination";
import { listProducts } from "@/lib/api";

export const metadata = {
  title: "محصولات | تجهیزات پزشکی و آزمایشگاهی فرجی",
};

const PAGE_SIZE = 24;

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const page =
    typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;

  const { items, total, limit } = await listProducts({
    category,
    page,
    limit: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-navy">محصولات</h1>
      <p className="mt-1 text-sm text-secondary-text">
        {total.toLocaleString("fa-IR")} محصول
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-secondary-text">
          در حال حاضر محصولی برای نمایش وجود ندارد.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/products"
        category={category}
      />
    </Container>
  );
}
