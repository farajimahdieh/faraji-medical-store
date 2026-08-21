"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getMe, logout, type PublicUser } from "@/lib/api";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export default function AccountPage() {
  const router = useRouter();
  const { reset: resetWishlist } = useWishlist();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    resetWishlist();
    router.push("/login");
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
    <Container className="flex flex-1 flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-sm rounded-[24px] border border-border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-navy">
          سلام {user.firstName ?? "کاربر"} عزیز
        </h1>
        <dl className="mt-6 text-sm">
          <div className="flex justify-between border-b border-border py-3">
            <dt className="text-secondary-text">شماره موبایل</dt>
            <dd dir="ltr" className="font-medium text-navy">
              {user.phone}
            </dd>
          </div>
          <div className="flex justify-between border-b border-border py-3">
            <dt className="text-secondary-text">نام کامل</dt>
            <dd className="font-medium text-navy">
              {user.firstName} {user.lastName}
            </dd>
          </div>
        </dl>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 h-11 w-full rounded-xl border border-accent-red/25 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/5 disabled:opacity-50"
        >
          {loggingOut ? "در حال خروج..." : "خروج از حساب"}
        </button>
      </div>
    </Container>
  );
}
