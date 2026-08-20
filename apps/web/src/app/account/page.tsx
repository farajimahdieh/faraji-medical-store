"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout, type PublicUser } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
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
    router.push("/login");
  }

  if (loading) {
    return (
      <p className="px-6 py-24 text-center text-sm text-slate-500">
        در حال بارگذاری...
      </p>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          سلام {user.firstName ?? "کاربر"} عزیز 👋
        </h1>
        <dl className="mt-6 text-sm">
          <div className="flex justify-between border-b border-sky-50 py-3">
            <dt className="text-slate-500">شماره موبایل</dt>
            <dd dir="ltr" className="font-medium text-slate-800">
              {user.phone}
            </dd>
          </div>
          <div className="flex justify-between border-b border-sky-50 py-3">
            <dt className="text-slate-500">نام کامل</dt>
            <dd className="font-medium text-slate-800">
              {user.firstName} {user.lastName}
            </dd>
          </div>
        </dl>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-lg border border-red-200 px-4 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {loggingOut ? "در حال خروج..." : "خروج از حساب"}
        </button>
      </div>
    </div>
  );
}
