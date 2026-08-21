"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
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
    <Container className="flex flex-1 flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-sm rounded-[24px] border border-border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-navy">ورود / ثبت‌نام</h1>

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
              شماره موبایل
              <input
                type="tel"
                inputMode="numeric"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              {loading ? "در حال ارسال..." : "ارسال کد"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <p className="rounded-xl bg-medical-bg px-3 py-2 text-sm text-navy">
              کد ۶ رقمی برای {phone} ارسال شد.
            </p>
            <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
              کد تایید
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="h-11 rounded-xl border border-border px-3 tracking-widest text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
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
              {loading ? "در حال بررسی..." : "تایید"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-sm text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              تغییر شماره موبایل
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}
