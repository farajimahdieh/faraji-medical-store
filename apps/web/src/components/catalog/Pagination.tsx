import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  category,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  category?: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label="صفحه‌بندی محصولات"
    >
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (targetPage) => (
          <Link
            key={targetPage}
            href={hrefFor(targetPage)}
            aria-current={targetPage === page ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              targetPage === page
                ? "bg-primary text-white"
                : "text-secondary-text hover:bg-medical-bg"
            }`}
          >
            {targetPage.toLocaleString("fa-IR")}
          </Link>
        ),
      )}
    </nav>
  );
}
