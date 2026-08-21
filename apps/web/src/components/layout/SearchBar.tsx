"use client";

import { History, ImageIcon, Loader2, Package, Search, Tag, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { getProductSuggestions, mediaUrl, type PublicSuggestion } from "@/lib/api";
import { highlightMatch } from "@/lib/highlight-match";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
  MAX_VISIBLE_SEARCH_HISTORY,
} from "@/lib/search-history";

const DEBOUNCE_MS = 300;
const SUGGESTION_LIMIT = 6;

function suggestionHref(suggestion: PublicSuggestion): string {
  switch (suggestion.type) {
    case "product":
      return `/products/${encodeURIComponent(suggestion.slug)}`;
    case "subcategory":
      return `/categories/${suggestion.slug}`;
    case "brand":
      return `/products?brand=${encodeURIComponent(suggestion.slug)}`;
  }
}

function suggestionKey(suggestion: PublicSuggestion, index: number): string {
  return suggestion.type === "product" ? suggestion.id : `${suggestion.type}-${index}`;
}

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PublicSuggestion[]>([]);
  // localStorage isn't available during SSR, hence the guard — but since
  // `history` only affects the dropdown, which stays unrendered until
  // focus, reading it eagerly here (rather than in a mount effect) can't
  // cause a hydration mismatch.
  const [history, setHistory] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getSearchHistory(),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  // Small client-side cache so retyping a query the user already searched
  // (e.g. cleared then re-typed, or tabbed away and back) doesn't refetch.
  const cache = useRef<Map<string, PublicSuggestion[]>>(new Map());

  // The header lives in the root layout, outside `{children}` — it never
  // remounts on navigation, so its state would otherwise leak from one
  // page to the next (e.g. a typed-but-unsubmitted query still showing
  // after the user has navigated away). Reset the *current* search state
  // whenever the route changes; `history` is untouched, since recent
  // searches are meant to survive navigation. State is adjusted here
  // during render (see SearchInput.tsx's `syncedQuery`) rather than in an
  // effect, to avoid an extra render — but refs can't be touched during
  // render, so cancelling the pending debounce/fetch below is a separate
  // effect keyed on the same `pathname`.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
    setActiveIndex(-1);
  }

  const isHistoryMode = query.trim().length === 0;
  const visibleHistory = history.slice(0, MAX_VISIBLE_SEARCH_HISTORY);
  const optionsCount = isHistoryMode ? visibleHistory.length : suggestions.length;

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortController.current?.abort();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function runFetch(value: string) {
    const cached = cache.current.get(value);
    if (cached) {
      setSuggestions(cached);
      setIsOpen(true);
      setIsLoading(false);
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    try {
      const { suggestions: results } = await getProductSuggestions(
        value,
        SUGGESTION_LIMIT,
        { signal: controller.signal },
      );
      cache.current.set(value, results);
      setSuggestions(results);
      setIsOpen(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Fail quiet — keep full-search (Enter/submit) working rather than
      // surfacing a broken dropdown over a stale suggestion list.
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      if (abortController.current === controller) setIsLoading(false);
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = value.trim();
    if (!trimmed) {
      // Back to an empty box — Suggestions give way to Recent Searches.
      abortController.current?.abort();
      setIsLoading(false);
      setSuggestions([]);
      setIsOpen(history.length > 0);
      return;
    }

    // Clear stale results from whatever was previously typed immediately,
    // so nothing mismatched flashes while the debounced fetch is pending —
    // `isLoading` (set now, not just once the request starts) is what
    // keeps the "no results" empty state from flashing during that wait.
    setSuggestions([]);
    setIsLoading(true);
    setIsOpen(true);
    debounceTimer.current = setTimeout(() => void runFetch(trimmed), DEBOUNCE_MS);
  }

  function handleFocus() {
    if (isHistoryMode) {
      if (history.length > 0) setIsOpen(true);
      return;
    }
    if (suggestions.length > 0) setIsOpen(true);
  }

  function goToSuggestion(suggestion: PublicSuggestion) {
    setIsOpen(false);
    setQuery(suggestion.label);
    setHistory(addSearchHistory(suggestion.label));
    router.push(suggestionHref(suggestion));
  }

  function selectHistoryTerm(term: string) {
    setIsOpen(false);
    setQuery(term);
    setHistory(addSearchHistory(term));
    router.push(`/products?q=${encodeURIComponent(term)}`);
  }

  function submitFullSearch() {
    setIsOpen(false);
    const trimmed = query.trim();
    if (trimmed) setHistory(addSearchHistory(trimmed));
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  function deleteHistoryTerm(term: string, event: MouseEvent) {
    event.stopPropagation();
    setHistory(removeSearchHistoryItem(term));
    setActiveIndex(-1);
  }

  function handleClearHistory() {
    setHistory(clearSearchHistory());
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isOpen && activeIndex >= 0) {
      if (isHistoryMode) {
        const term = visibleHistory[activeIndex];
        if (term) {
          selectHistoryTerm(term);
          return;
        }
      } else if (suggestions[activeIndex]) {
        goToSuggestion(suggestions[activeIndex]);
        return;
      }
    }
    submitFullSearch();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (optionsCount === 0) return;
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((current) => (current + 1) % optionsCount);
    } else if (event.key === "ArrowUp") {
      if (optionsCount === 0) return;
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + optionsCount) % optionsCount);
    } else if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    }
  }

  function handleClear() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortController.current?.abort();
    setQuery("");
    setSuggestions([]);
    setIsLoading(false);
    setActiveIndex(-1);
    setIsOpen(history.length > 0);
    inputRef.current?.focus();
  }

  const showDropdown = isOpen;
  const showSuggestionsEmptyState =
    !isHistoryMode && showDropdown && !isLoading && suggestions.length === 0;
  const activeOptionId =
    activeIndex < 0
      ? undefined
      : isHistoryMode
        ? visibleHistory[activeIndex]
          ? `${listboxId}-history-${activeIndex}`
          : undefined
        : suggestions[activeIndex]
          ? `${listboxId}-${suggestionKey(suggestions[activeIndex], activeIndex)}`
          : undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <Search
          className="pointer-events-none absolute top-1/2 right-4 h-4.5 w-4.5 -translate-y-1/2 text-primary"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          // Plain "text", not "search" — type="search" makes Chromium/
          // WebKit render their own native clear ("×") icon whenever the
          // field has a value, stacking a second, unstyled × next to our
          // own custom clear button below.
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="جستجو در محصولات، برندها و دسته‌بندی‌ها..."
          aria-label="جستجو در محصولات"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          className="h-11 w-full rounded-full border border-primary/30 bg-primary-tint/40 py-2 pr-11 pl-10 text-sm text-navy outline-none transition-colors placeholder:text-secondary-text focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
        {query && (
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

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={isHistoryMode ? "جستجوهای اخیر" : "پیشنهادهای جستجو"}
          className="absolute top-full right-0 left-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-white py-2 shadow-lg"
        >
          {isHistoryMode ? (
            visibleHistory.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 pt-1 pb-2">
                  <span className="text-xs font-medium text-secondary-text">
                    جستجوهای اخیر
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs font-medium text-secondary-text transition-colors hover:text-accent-red"
                  >
                    پاک کردن تاریخچه
                  </button>
                </div>
                {visibleHistory.map((term, index) => (
                  <HistoryRow
                    key={term}
                    id={`${listboxId}-history-${index}`}
                    term={term}
                    active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectHistoryTerm(term)}
                    onDelete={(event) => deleteHistoryTerm(term, event)}
                  />
                ))}
              </>
            )
          ) : (
            <>
              {suggestions.length > 0 && (
                <div className="px-4 pt-1 pb-2">
                  <span className="text-xs font-medium text-secondary-text">پیشنهادها</span>
                </div>
              )}

              {isLoading && suggestions.length === 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-secondary-text">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  در حال جستجو...
                </div>
              )}

              {showSuggestionsEmptyState && (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-secondary-text">نتیجه‌ای پیدا نشد.</p>
                  <button
                    type="button"
                    onClick={submitFullSearch}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    جستجوی کامل برای «{query.trim()}»
                  </button>
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <SuggestionRow
                  key={suggestionKey(suggestion, index)}
                  id={`${listboxId}-${suggestionKey(suggestion, index)}`}
                  suggestion={suggestion}
                  query={query}
                  active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToSuggestion(suggestion)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  id,
  term,
  active,
  onMouseEnter,
  onClick,
  onDelete,
}: {
  id: string;
  term: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  onDelete: (event: MouseEvent) => void;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-right transition-colors ${
        active ? "bg-medical-bg" : "hover:bg-medical-bg"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medical-bg text-secondary-text">
        <History className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-navy">{term}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`حذف «${term}» از تاریخچه`}
        className="shrink-0 rounded-md p-1.5 text-secondary-text transition-colors hover:bg-white hover:text-accent-red"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function SuggestionRow({
  id,
  suggestion,
  query,
  active,
  onMouseEnter,
  onClick,
}: {
  id: string;
  suggestion: PublicSuggestion;
  query: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  const segments = highlightMatch(suggestion.label, query);

  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-right transition-colors ${
        active ? "bg-medical-bg" : "hover:bg-medical-bg"
      }`}
    >
      <SuggestionIcon suggestion={suggestion} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-navy">
          {segments.map((segment, index) =>
            segment.match ? (
              <mark key={index} className="rounded-sm bg-tint-blue text-primary">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </span>
        {suggestion.type === "product" && suggestion.brand && (
          <span className="block truncate text-xs text-secondary-text">
            {suggestion.brand}
          </span>
        )}
        {suggestion.type === "subcategory" && (
          <span className="block truncate text-xs text-secondary-text">دسته‌بندی</span>
        )}
        {suggestion.type === "brand" && (
          <span className="block truncate text-xs text-secondary-text">برند</span>
        )}
      </span>
    </button>
  );
}

function SuggestionIcon({ suggestion }: { suggestion: PublicSuggestion }) {
  if (suggestion.type === "product") {
    if (suggestion.image) {
      return (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-medical-bg">
          <Image
            src={mediaUrl(suggestion.image)}
            alt=""
            fill
            sizes="32px"
            className="object-contain p-0.5"
          />
        </span>
      );
    }
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medical-bg text-primary/40">
        <ImageIcon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medical-bg text-primary">
      {suggestion.type === "brand" ? (
        <Tag className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Package className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}
