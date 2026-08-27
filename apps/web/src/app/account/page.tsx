"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getMe, type PublicUser } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useCart } from "@/components/cart/CartProvider";
import { AccountNav, type AccountSection } from "@/components/account/AccountNav";
import { ProfileSection } from "@/components/account/ProfileSection";
import { AddressesSection } from "@/components/account/AddressesSection";
import { CouponsSection } from "@/components/account/CouponsSection";
import { OrdersSection } from "@/components/account/OrdersSection";

const VALID_SECTIONS: AccountSection[] = ["profile", "addresses", "coupons", "orders"];

function isAccountSection(value: string | null): value is AccountSection {
  return VALID_SECTIONS.includes(value as AccountSection);
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageContent />
    </Suspense>
  );
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout: authLogout, refresh: authRefresh } = useAuth();
  const { reset: resetWishlist } = useWishlist();
  const { reset: resetCart } = useCart();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState<AccountSection>(() => {
    const requested = searchParams.get("section");
    return isAccountSection(requested) ? requested : "profile";
  });

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await authLogout();
    resetWishlist();
    resetCart();
    router.push("/login");
  }

  function handleUserChange(updated: PublicUser) {
    setUser(updated);
    // Keeps the Header's profile popover (name greeting) in sync immediately.
    authRefresh();
  }

  if (loading) {
    return (
      <p className="px-6 py-24 text-center text-sm text-secondary-text">
        در حال بارگذاری...
      </p>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">سلام، {user.firstName ?? "کاربر"}</h1>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="h-10 rounded-xl border border-accent-red/25 px-4 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/5 disabled:opacity-50"
        >
          {loggingOut ? "در حال خروج..." : "خروج از حساب"}
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountNav active={section} onChange={setSection} />

        <div className="min-w-0 flex-1">
          {section === "profile" && <ProfileSection user={user} onUserChange={handleUserChange} />}
          {section === "addresses" && <AddressesSection />}
          {section === "coupons" && <CouponsSection />}
          {section === "orders" && <OrdersSection />}
        </div>
      </div>
    </Container>
  );
}
