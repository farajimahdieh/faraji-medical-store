"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import type { AddressInput, PublicUserAddress } from "@/lib/api";

const TITLE_QUICK_OPTIONS = ["خانه", "محل کار", "شرکت"];

// Same shape the backend's normalizeIranPhone accepts -- a light client-side
// check to catch obvious typos early; the backend stays the source of truth.
const IRAN_MOBILE_PATTERN = /^(?:\+98|0098|98|0)?9\d{9}$/;

interface FormState {
  title: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  buildingNumber: string;
  unit: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  recipientName: "",
  recipientPhone: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  buildingNumber: "",
  unit: "",
  isDefault: false,
};

function toFormState(address?: PublicUserAddress): FormState {
  if (!address) return EMPTY_FORM;
  return {
    title: address.title,
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    buildingNumber: address.buildingNumber ?? "",
    unit: address.unit ?? "",
    isDefault: address.isDefault,
  };
}

export function AddressFormModal({
  open,
  onClose,
  onSubmit,
  address,
  autoDefault,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: AddressInput) => Promise<void>;
  address?: PublicUserAddress;
  /** true only for a user's very first address -- the backend defaults it automatically. */
  autoDefault?: boolean;
}) {
  const [values, setValues] = useState<FormState>(() => toFormState(address));
  const [saving, setSaving] = useState(false);

  // Re-seed the form each time the modal opens (new address vs. editing a
  // specific one) -- same "adjust during render" approach as MobileFiltersSheet.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValues(toFormState(address));
  }

  const isEditing = Boolean(address);

  const recipientPhoneError =
    values.recipientPhone.length > 0 &&
    !IRAN_MOBILE_PATTERN.test(values.recipientPhone.replace(/[\s-]/g, ""))
      ? "شماره موبایل معتبر نیست"
      : undefined;
  const postalCodeError =
    values.postalCode.length > 0 && !/^\d{10}$/.test(values.postalCode)
      ? "کد پستی باید ۱۰ رقم باشد"
      : undefined;

  const requiredFilled =
    values.title.trim().length > 0 &&
    values.recipientName.trim().length > 0 &&
    values.recipientPhone.trim().length > 0 &&
    values.province.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.addressLine.trim().length > 0 &&
    values.postalCode.trim().length > 0;

  const canSubmit = requiredFilled && !recipientPhoneError && !postalCodeError && !saving;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        recipientName: values.recipientName.trim(),
        recipientPhone: values.recipientPhone.trim(),
        province: values.province.trim(),
        city: values.city.trim(),
        addressLine: values.addressLine.trim(),
        postalCode: values.postalCode.trim(),
        buildingNumber: values.buildingNumber.trim() || null,
        unit: values.unit.trim() || null,
        isDefault: values.isDefault,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "ویرایش آدرس" : "افزودن آدرس جدید"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-secondary-text">
            عنوان آدرس{" "}
            <span className="text-accent-red" aria-hidden="true">
              *
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {TITLE_QUICK_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValues((v) => ({ ...v, title: option }))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  values.title === option
                    ? "border-primary bg-primary text-white"
                    : "border-border text-navy hover:border-primary/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <input
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="مثلاً: منزل مادر"
            maxLength={100}
            required
            aria-label="عنوان آدرس"
            className="h-11 rounded-xl border border-border px-3 text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <TextField
          label="نام گیرنده"
          required
          value={values.recipientName}
          onChange={(e) => setValues((v) => ({ ...v, recipientName: e.target.value }))}
          maxLength={150}
        />

        <TextField
          label="شماره گیرنده"
          required
          dir="ltr"
          inputMode="numeric"
          placeholder="09xxxxxxxxx"
          value={values.recipientPhone}
          onChange={(e) => setValues((v) => ({ ...v, recipientPhone: e.target.value }))}
          error={recipientPhoneError}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="استان"
            required
            value={values.province}
            onChange={(e) => setValues((v) => ({ ...v, province: e.target.value }))}
            maxLength={100}
          />
          <TextField
            label="شهر"
            required
            value={values.city}
            onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address-line" className="text-sm text-secondary-text">
            آدرس کامل{" "}
            <span className="text-accent-red" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="address-line"
            required
            rows={3}
            maxLength={500}
            value={values.addressLine}
            onChange={(e) => setValues((v) => ({ ...v, addressLine: e.target.value }))}
            className="rounded-xl border border-border px-3 py-2.5 text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="پلاک"
            hint="اختیاری"
            value={values.buildingNumber}
            onChange={(e) => setValues((v) => ({ ...v, buildingNumber: e.target.value }))}
            dir="ltr"
            maxLength={20}
          />
          <TextField
            label="واحد"
            hint="اختیاری"
            value={values.unit}
            onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value }))}
            dir="ltr"
            maxLength={20}
          />
          <TextField
            label="کد پستی"
            required
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            value={values.postalCode}
            onChange={(e) => setValues((v) => ({ ...v, postalCode: e.target.value }))}
            error={postalCodeError}
          />
        </div>

        {autoDefault ? (
          <p className="rounded-xl bg-medical-bg px-3 py-2.5 text-xs text-secondary-text">
            این آدرس به‌طور خودکار پیش‌فرض خواهد شد.
          </p>
        ) : (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(e) => setValues((v) => ({ ...v, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            انتخاب به‌عنوان آدرس پیش‌فرض
          </label>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={!canSubmit} className="flex-1">
            {saving ? "در حال ذخیره..." : isEditing ? "ذخیره تغییرات" : "افزودن آدرس"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </form>
    </Modal>
  );
}
