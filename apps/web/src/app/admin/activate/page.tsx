"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { requestAdminActivation, activateAdmin } from "@/lib/admin-api";
import { isStrongPassword, PASSWORD_HINT } from "@/lib/password";
import { useAuth } from "@/components/auth/AuthProvider";

type Step = "phone" | "activate";

export default function AdminActivatePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestAdminActivation(phone);
      setStep("activate");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    setLoading(true);
    try {
      await activateAdmin(phone, code, password);
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
        <h1 className="mb-6 text-xl font-bold text-navy">فعال‌سازی حساب مدیریت</h1>

        {step === "phone" && (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <TextField
              label="شماره موبایل"
              type="tel"
              inputMode="numeric"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {error && <p className="text-sm text-accent-red">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </Button>
          </form>
        )}

        {step === "activate" && (
          <form onSubmit={handleActivate} className="flex flex-col gap-4">
            <p className="rounded-xl bg-medical-bg px-3 py-2 text-sm text-navy">
              در صورت معتبر بودن دعوت، کد تایید برای {phone} پیامک شد.
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
            <PasswordField
              label="رمز عبور جدید"
              hint={PASSWORD_HINT}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordField
              label="تکرار رمز عبور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-accent-red">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال فعال‌سازی..." : "فعال‌سازی و ورود"}
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}
