"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </ToastProvider>
  );
}
