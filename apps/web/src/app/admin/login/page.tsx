"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { adminLoginPassword, adminLoginVerify } from "@/lib/admin-api";
import { useAuth } from "@/components/auth/AuthProvider";

type Step = "credentials" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLoginPassword(phone, password);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLoginVerify(phone, code);
      await refresh();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex flex-1 flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-sm rounded-[24px] border border-border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-navy">ورود مدیریت</h1>

        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <TextField
              label="شماره موبایل"
              type="tel"
              inputMode="numeric"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <PasswordField
              label="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-accent-red">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال بررسی..." : "ادامه"}
            </Button>
            <Link
              href="/admin/activate"
              className="text-center text-sm text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              حساب خود را فعال نکرده‌اید؟ فعال‌سازی حساب
            </Link>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <p className="rounded-xl bg-medical-bg px-3 py-2 text-sm text-navy">
              در صورت صحت اطلاعات، کد تایید برای {phone} پیامک شد.
            </p>
            <TextField
              label="کد تایید"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-accent-red">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setCode("");
                setError(null);
              }}
              className="text-sm text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              بازگشت
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}
