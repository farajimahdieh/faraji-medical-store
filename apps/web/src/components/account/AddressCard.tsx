"use client";

import { useState } from "react";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import type { PublicUserAddress } from "@/lib/api";

export function AddressCard({
  address,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  address: PublicUserAddress;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-bold text-navy">{address.title}</span>
        </div>
        {address.isDefault && (
          <span className="shrink-0 rounded-full bg-tint-blue px-2.5 py-1 text-[11px] font-semibold text-primary">
            آدرس پیش‌فرض
          </span>
        )}
      </div>

      <dl className="flex flex-col gap-1 text-sm text-secondary-text">
        <div className="flex justify-between gap-2">
          <dt>گیرنده</dt>
          <dd className="text-navy">{address.recipientName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>شماره تماس</dt>
          <dd dir="ltr" className="text-navy">
            {address.recipientPhone}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>استان / شهر</dt>
          <dd className="text-navy">
            {address.province} / {address.city}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>کد پستی</dt>
          <dd dir="ltr" className="text-navy">
            {address.postalCode}
          </dd>
        </div>
      </dl>

      <p className="text-sm leading-6 break-words text-navy">
        {address.addressLine}
        {address.buildingNumber && ` - پلاک ${address.buildingNumber}`}
        {address.unit && `، واحد ${address.unit}`}
      </p>

      {confirmingDelete ? (
        <div className="flex items-center gap-2 rounded-xl bg-tint-red p-2.5">
          <p className="flex-1 text-sm text-accent-red">این آدرس حذف شود؟</p>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg bg-accent-red px-3 py-1.5 text-xs font-semibold text-white"
          >
            بله، حذف شود
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-navy"
          >
            انصراف
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-medical-bg"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            ویرایش
          </button>
          {!address.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-tint-blue"
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              انتخاب به‌عنوان پیش‌فرض
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-red hover:bg-accent-red/5"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            حذف
          </button>
        </div>
      )}
    </div>
  );
}
