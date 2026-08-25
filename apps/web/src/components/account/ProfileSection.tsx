"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { JalaliDateInput } from "@/components/ui/JalaliDateInput";
import { useToast } from "@/components/toast/ToastProvider";
import { completeProfile, type PublicUser } from "@/lib/api";
import { isFutureDateString } from "@/lib/date";
import { formatJalaliLong, gregorianToJalali } from "@/lib/jalali";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  birthDate: string; // '' means not set -- never a Date object, see lib/date.ts
}

const FRIENDLY_BIRTHDATE_HINT = "اختیاریه؛ شاید یه روز بهونه‌ای شد برای یه هدیه کوچیک 🎁";

function jalaliPreview(gregorianDate: string): string {
  const { jy, jm, jd } = gregorianToJalali(gregorianDate);
  return formatJalaliLong(jy, jm, jd);
}

function toFormValues(user: PublicUser): ProfileFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    birthDate: user.birthDate ?? "",
  };
}

export function ProfileSection({
  user,
  onUserChange,
}: {
  user: PublicUser;
  onUserChange: (user: PublicUser) => void;
}) {
  const { showToast } = useToast();
  const [initial, setInitial] = useState<ProfileFormValues>(() => toFormValues(user));
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(user));
  const [saving, setSaving] = useState(false);

  const trimmedFirstName = values.firstName.trim();
  const trimmedLastName = values.lastName.trim();

  const firstNameError = trimmedFirstName.length === 0 ? "نام را وارد کنید" : undefined;
  const lastNameError = trimmedLastName.length === 0 ? "نام خانوادگی را وارد کنید" : undefined;
  const birthDateError =
    values.birthDate && isFutureDateString(values.birthDate)
      ? "تاریخ تولد نمی‌تواند در آینده باشد"
      : undefined;

  const isDirty =
    values.firstName !== initial.firstName ||
    values.lastName !== initial.lastName ||
    values.birthDate !== initial.birthDate;

  const hasErrors = Boolean(firstNameError || lastNameError || birthDateError);

  function handleCancel() {
    setValues(initial);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (hasErrors || saving) return;

    setSaving(true);
    try {
      const { user: updated } = await completeProfile(
        trimmedFirstName,
        trimmedLastName,
        values.birthDate || undefined,
      );
      const nextValues = toFormValues(updated);
      setInitial(nextValues);
      setValues(nextValues);
      onUserChange(updated);
      showToast("اطلاعات حساب شما ذخیره شد", { variant: "success" });
    } catch {
      showToast("ذخیره تغییرات انجام نشد. دوباره تلاش کنید.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-navy">اطلاعات حساب</h2>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="نام"
            required
            value={values.firstName}
            onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
            error={firstNameError}
            maxLength={100}
          />
          <TextField
            label="نام خانوادگی"
            required
            value={values.lastName}
            onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
            error={lastNameError}
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-phone" className="text-sm text-secondary-text">
            شماره موبایل
          </label>
          <input
            id="account-phone"
            type="tel"
            dir="ltr"
            readOnly
            value={user.phone}
            className="h-11 cursor-not-allowed rounded-xl border border-border bg-neutral-bg px-3 text-navy outline-none"
          />
          <p className="text-xs text-secondary-text">شماره موبایل حساب شما</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <JalaliDateInput
            legend="تاریخ تولد (اختیاری)"
            value={values.birthDate}
            onChange={(birthDate) => setValues((v) => ({ ...v, birthDate }))}
            error={birthDateError}
            hint={
              values.birthDate ? `تاریخ انتخابی: ${jalaliPreview(values.birthDate)}` : FRIENDLY_BIRTHDATE_HINT
            }
          />
          <p className="text-xs text-secondary-text/70">
            ثبت تاریخ تولد اختیاری است و ممکن است در آینده برای هدیه‌ها و پیشنهادهای مناسبتی استفاده شود.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={!isDirty || hasErrors || saving}>
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
          {isDirty && !saving && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              لغو تغییرات
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
