"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

const DEBOUNCE_MS = 400;

export function SearchInput({
  placeholder,
  className = "",
}: {
  placeholder: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(initialQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when navigation changes ?q= from elsewhere
  // (e.g. an active-filter chip's "×") — adjusted during render, per
  // https://react.dev/learn/you-might-not-need-an-effect, rather than in
  // an effect that would fire an extra render.
  const [syncedQuery, setSyncedQuery] = useState(initialQuery);
  if (initialQuery !== syncedQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  function navigateWithQuery(query: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => navigateWithQuery(next), DEBOUNCE_MS);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    navigateWithQuery(value);
  }

  function handleClear() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setValue("");
    navigateWithQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <Search
        className="pointer-events-none absolute top-1/2 right-4 h-4.5 w-4.5 -translate-y-1/2 text-secondary-text"
        aria-hidden="true"
      />
      <input
        // Plain "text", not "search" — type="search" makes Chromium/
        // WebKit render their own native clear ("×") icon whenever the
        // field has a value, stacking a second, unstyled × next to our
        // own custom clear button below.
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-full border border-border bg-white py-2 pr-11 pl-10 text-sm text-navy outline-none transition-colors placeholder:text-secondary-text focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="پاک کردن جستجو"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-secondary-text transition-colors hover:text-navy"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
