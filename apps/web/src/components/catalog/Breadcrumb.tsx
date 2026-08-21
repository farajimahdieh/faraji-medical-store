import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="مسیر صفحه" className="mb-6 text-sm text-secondary-text">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-1.5">/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-primary">
              {item.label}
            </Link>
          ) : index === items.length - 1 ? (
            <span className="text-navy">{item.label}</span>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
