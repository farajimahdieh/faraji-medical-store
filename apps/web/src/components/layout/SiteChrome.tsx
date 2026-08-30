"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

// The admin panel has its own independent layout (apps/web/src/app/admin/
// layout.tsx) and must not show the storefront's Header/Footer or any
// customer-shopping chrome. Full route-group root-layout separation is
// possible in Next.js but requires moving every existing customer route
// into a new folder -- this conditional achieves the same visible result
// with no directory changes and no risk to existing routes.
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
