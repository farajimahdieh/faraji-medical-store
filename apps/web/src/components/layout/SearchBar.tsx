"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

export function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Search is not connected to a real API yet — this is a placeholder
    // submit handler, wired for when /products?q= (or a search endpoint)
    // exists.
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <Search
        className="pointer-events-none absolute top-1/2 right-4 h-4.5 w-4.5 -translate-y-1/2 text-secondary-text"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجو در محصولات، برندها و دسته‌بندی‌ها..."
        aria-label="جستجو در محصولات"
        className="h-11 w-full rounded-full border border-border bg-neutral-bg py-2 pr-11 pl-4 text-sm text-navy outline-none transition-colors placeholder:text-secondary-text focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
      />
    </form>
  );
}
