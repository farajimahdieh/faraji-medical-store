"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { categories } from "@/data/categories";
import { mainNavLinks } from "@/data/navigation";
import { SearchBar } from "./SearchBar";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-navy lg:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div className="absolute top-0 right-0 flex h-full w-[85%] max-w-sm flex-col gap-6 overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-navy">منو</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-text"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <SearchBar />

            <div>
              <button
                type="button"
                aria-expanded={categoriesOpen}
                onClick={() => setCategoriesOpen((v) => !v)}
                className="flex w-full items-center justify-between py-3 text-sm font-semibold text-navy"
              >
                دسته‌بندی‌ها
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {categoriesOpen && (
                <ul className="flex flex-col gap-1 pb-2">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <a
                        href={`/categories/${category.slug}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg py-2 pr-2 text-sm text-secondary-text transition-colors hover:bg-medical-bg hover:text-primary"
                      >
                        {category.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <nav className="flex flex-col gap-1 border-t border-border pt-4">
              {mainNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg py-2.5 text-sm font-medium text-navy transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
