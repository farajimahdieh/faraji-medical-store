import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { mediaUrl, type PublicProductListItem } from "@/lib/api";
import { formatPriceDisplay, formatStockStatus } from "@/lib/catalog-format";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

const stockToneClass: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-primary",
  negative: "text-accent-red",
  neutral: "text-secondary-text",
};

export function ProductCard({ product }: { product: PublicProductListItem }) {
  const href = `/products/${encodeURIComponent(product.slug)}`;
  const stock = formatStockStatus(product.stockStatus);
  const priceLabel = formatPriceDisplay(product.price);
  const priceAvailable = product.price.status === "available";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md">
      <div className="relative">
        <Link
          href={href}
          className="flex aspect-square items-center justify-center bg-medical-bg"
        >
          {product.primaryImage ? (
            <Image
              src={mediaUrl(product.primaryImage.url)}
              alt={product.primaryImage.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-4"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-primary/40" aria-hidden="true" />
          )}
        </Link>
        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute top-3 left-3"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={href}>
          <h3 className="text-sm leading-6 font-bold text-navy">{product.name}</h3>
        </Link>
        {product.brand && (
          <p className="text-xs text-secondary-text">{product.brand.name}</p>
        )}

        {product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((size) => (
              <span
                key={size}
                className="rounded-md bg-medical-bg px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        <span className={`text-xs font-medium ${stockToneClass[stock.tone]}`}>
          {stock.label}
        </span>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <span
            className={
              priceAvailable
                ? "text-sm font-bold text-navy"
                : "text-xs font-medium text-secondary-text"
            }
          >
            {priceLabel}
          </span>
          <Link
            href={href}
            className="shrink-0 rounded-xl bg-medical-bg px-3 py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            مشاهده محصول
          </Link>
        </div>
      </div>
    </div>
  );
}
