"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

// Backend guards (SessionGuard + RolesGuard) are the real enforcement --
// this only avoids a flash of admin UI for a logged-out/wrong-role viewer.
export function RequireRole({
  role,
  children,
}: {
  role: "admin" | "super_admin";
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();

  const allowed =
    status === "authenticated" &&
    !!user &&
    (user.role === role || user.role === "super_admin");

  // Redirecting is a side effect -- it must happen in an effect, never
  // synchronously during render. Always redirect to /admin/login, never
  // back to an /admin/* path: this guard runs *on* /admin/* pages, so
  // redirecting there for the "logged in with the wrong role" case just
  // sends the browser back to the same page -- a no-op that leaves this
  // stuck on the "checking access" text forever instead of navigating.
  useEffect(() => {
    if (status === "loading" || allowed) return;
    router.replace("/admin/login");
  }, [status, allowed, router]);

  if (status === "loading" || !allowed) {
    return (
      <p className="px-6 py-24 text-center text-sm text-secondary-text">
        در حال بررسی دسترسی...
      </p>
    );
  }

  return <>{children}</>;
}
