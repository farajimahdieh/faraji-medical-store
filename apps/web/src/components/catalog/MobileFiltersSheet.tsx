"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface SheetLinkOption {
  label: string;
  href: string;
  active: boolean;
  count: number;
}

export interface SheetCheckOption {
  label: string;
  value: string;
  count: number;
}

export function MobileFiltersSheet({
  subcategoryLinks,
  brandOptions,
  sizeOptions,
}: {
  subcategoryLinks: SheetLinkOption[];
  brandOptions: SheetCheckOption[];
  sizeOptions: SheetCheckOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [size, setSize] = useState(searchParams.get("size") ?? "");

  // Re-seed the staged selection from the URL each time the sheet opens —
  // adjusted during render (see SearchInput.tsx) rather than in an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBrand(searchParams.get("brand") ?? "");
      setSize(searchParams.get("size") ?? "");
    }
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function navigate(nextBrand: string, nextSize: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextBrand) params.set("brand", nextBrand);
    else params.delete("brand");
    if (nextSize) params.set("size", nextSize);
    else params.delete("size");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  }

  const activeCount = (brand ? 1 : 0) + (size ? 1 : 0);
  const appliedCount =
    (searchParams.get("brand") ? 1 : 0) + (searchParams.get("size") ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-navy lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        فیلترها
        {appliedCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
            {appliedCount.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="بستن فیلترها"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-navy/40"
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-border p-5">
                <span className="text-base font-bold text-navy">فیلترها</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="بستن فیلترها"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-text"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {subcategoryLinks.length > 0 && (
                  <div className="mb-5 border-b border-border pb-5">
                    <h3 className="mb-3 text-sm font-bold text-navy">زیردسته</h3>
                    <ul className="flex flex-col gap-1">
                      {subcategoryLinks.map((option) => (
                        <li key={option.href}>
                          <Link
                            href={option.href}
                            onClick={() => setOpen(false)}
                            aria-current={option.active ? "page" : undefined}
                            className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                              option.active
                                ? "bg-tint-blue font-medium text-primary"
                                : "text-secondary-text hover:bg-medical-bg hover:text-navy"
                            }`}
                          >
                            {option.label}
                            <span className="text-xs text-secondary-text">
                              {option.count.toLocaleString("fa-IR")}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brandOptions.length > 0 && (
                  <fieldset className="mb-5 border-b border-border pb-5">
                    <legend className="mb-3 text-sm font-bold text-navy">برند</legend>
                    <ul className="flex flex-col gap-2">
                      {brandOptions.map((option) => (
                        <li key={option.value}>
                          <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-navy">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={brand === option.value}
                                onChange={() =>
                                  setBrand(brand === option.value ? "" : option.value)
                                }
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                              />
                              {option.label}
                            </span>
                            <span className="text-xs text-secondary-text">
                              {option.count.toLocaleString("fa-IR")}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}

                {sizeOptions.length > 0 && (
                  <fieldset>
                    <legend className="mb-3 text-sm font-bold text-navy">سایز</legend>
                    <ul className="flex flex-wrap gap-2">
                      {sizeOptions.map((option) => {
                        const isActive = size === option.value;
                        return (
                          <li key={option.value}>
                            <button
                              type="button"
                              onClick={() => setSize(isActive ? "" : option.value)}
                              aria-pressed={isActive}
                              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                isActive
                                  ? "border-primary bg-primary text-white"
                                  : "border-border text-navy hover:border-primary/40"
                              }`}
                            >
                              {option.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                )}
              </div>

              <div className="flex items-center gap-3 border-t border-border p-5">
                <button
                  type="button"
                  onClick={() => navigate("", "")}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-navy transition-colors hover:bg-medical-bg"
                >
                  پاک کردن فیلترها
                </button>
                <button
                  type="button"
                  onClick={() => navigate(brand, size)}
                  className="flex-[2] rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                  نمایش نتایج
                  {activeCount > 0 ? ` (${activeCount.toLocaleString("fa-IR")})` : ""}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
