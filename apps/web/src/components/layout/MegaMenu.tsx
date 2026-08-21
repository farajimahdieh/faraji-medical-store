"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/data/categories";

// Split the 8 categories into 4 columns of 2 for the desktop mega menu.
const columns = [categories.slice(0, 2), categories.slice(2, 4), categories.slice(4, 6), categories.slice(6, 8)];

export function MegaMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
          open ? "text-primary" : "text-navy"
        }`}
      >
        دسته‌بندی‌ها
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-40 mt-3 w-[720px] rounded-3xl border border-border bg-white p-6 shadow-xl"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="grid grid-cols-4 gap-6">
            {columns.map((column, index) => (
              <ul key={index} className="flex flex-col gap-4">
                {column.map((category) => {
                  const Icon = category.icon;
                  return (
                    <li key={category.slug}>
                      <a
                        href={`/categories/${category.slug}`}
                        className="group flex items-start gap-3"
                        onClick={() => setOpen(false)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-medical-bg text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                        </span>
                        <span className="text-sm leading-6 font-medium text-navy transition-colors group-hover:text-primary">
                          {category.name}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
