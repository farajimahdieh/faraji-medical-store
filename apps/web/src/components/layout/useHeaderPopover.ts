"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";

// Shared interaction logic for the header's hover/focus popovers (Wishlist,
// Profile, Cart) so all three open/close/keyboard-navigate identically.
// Wishlist's own popover predates this hook and keeps its inline copy of
// the same logic rather than being refactored onto it -- this hook exists
// so the two *new* popovers match it exactly without duplicating the ~80
// lines of hover-delay/focus/escape/outside-click handling a third time.

export const HEADER_POPOVER_PANEL_CLASSNAME =
  "absolute top-full left-0 z-40 mt-2 hidden w-72 rounded-2xl border border-border bg-white p-4 shadow-xl lg:block";

const CLOSE_DELAY_MS = 200;

export function useHeaderPopover<TTrigger extends HTMLElement = HTMLAnchorElement>() {
  const [open, setOpen] = useState(false);
  // Real hover-capable pointers only — guards against a touchscreen firing a
  // stray synthetic `mouseenter` on tap. Computed once lazily (never affects
  // rendered markup, so there's no SSR/hydration mismatch) rather than via
  // an effect.
  const [hoverCapable] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<TTrigger>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  function handleMouseEnter() {
    if (!hoverCapable) return;
    cancelClose();
    setOpen(true);
  }

  function handleMouseLeave() {
    if (!hoverCapable) return;
    scheduleClose();
  }

  function handleFocus() {
    setOpen(true);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (!next || !containerRef.current?.contains(next)) {
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
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
  }, [open]);

  return {
    open,
    setOpen,
    containerRef,
    triggerRef,
    containerProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    triggerAriaProps: {
      "aria-haspopup": "dialog" as const,
      "aria-expanded": open,
    },
    panelProps: {
      onMouseEnter: cancelClose,
      onMouseLeave: handleMouseLeave,
    },
  };
}
