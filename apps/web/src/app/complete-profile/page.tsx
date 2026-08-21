"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
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
      <p className="px-6 py-24 text-center text-sm text-secondary-text">
        در حال بررسی...
      </p>
    );
  }

  return (
    <Container className="flex flex-1 flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-sm rounded-[24px] border border-border bg-white p-8 shadow-sm">
        <span className="mb-3 inline-block rounded-full bg-medical-bg px-3 py-1 text-xs font-medium text-primary">
          خوش آمدید
        </span>
        <h1 className="text-xl font-bold text-navy">تکمیل ثبت‌نام</h1>
        <p className="mt-1 mb-6 text-sm text-secondary-text">
          لطفاً نام و نام خانوادگی خود را وارد کنید.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
            نام
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="h-11 rounded-xl border border-border px-3 text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
            نام خانوادگی
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="h-11 rounded-xl border border-border px-3 text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-3 py-2 text-sm text-accent-red">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ادامه"}
          </button>
        </form>
      </div>
    </Container>
  );
}
