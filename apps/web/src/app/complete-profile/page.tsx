"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, completeProfile, getMe } from "@/lib/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMe()
      .then(() => setCheckingSession(false))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeProfile(firstName, lastName);
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <p className="px-6 py-24 text-center text-sm text-slate-500">
        در حال بررسی...
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <span className="mb-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          خوش آمدید
        </span>
        <h1 className="text-xl font-bold text-slate-800">تکمیل ثبت‌نام</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          لطفاً نام و نام خانوادگی خود را وارد کنید.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-slate-600">
            نام
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-600">
            نام خانوادگی
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </label>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-green-200 transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ادامه"}
          </button>
        </form>
      </div>
    </div>
  );
}
