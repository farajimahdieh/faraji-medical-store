"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, requestOtp, verifyOtp } from "@/lib/api";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePhoneSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { isNewUser } = await verifyOtp(phone, code);
      router.push(isNewUser ? "/complete-profile" : "/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-slate-800">
          ورود / ثبت‌نام
        </h1>

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              شماره موبایل
              <input
                type="tel"
                inputMode="numeric"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
              className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "در حال ارسال..." : "ارسال کد"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
              کد ۶ رقمی برای {phone} ارسال شد.
            </p>
            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              کد تایید
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2.5 tracking-widest text-slate-800 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
              className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "در حال بررسی..." : "تایید"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-sm text-sky-600 underline underline-offset-2 hover:text-sky-700"
            >
              تغییر شماره موبایل
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
