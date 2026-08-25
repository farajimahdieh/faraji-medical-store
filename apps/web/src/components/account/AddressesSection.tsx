"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { useAddresses } from "./useAddresses";
import { AddressCard } from "./AddressCard";
import { AddressFormModal } from "./AddressFormModal";
import type { AddressInput, PublicUserAddress } from "@/lib/api";

export function AddressesSection() {
  const { status, addresses, add, edit, remove, makeDefault, reload } = useAddresses();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PublicUserAddress | undefined>(undefined);

  function openAddModal() {
    setEditingAddress(undefined);
    setModalOpen(true);
  }

  function openEditModal(address: PublicUserAddress) {
    setEditingAddress(address);
    setModalOpen(true);
  }

  async function handleSubmit(input: AddressInput) {
    try {
      if (editingAddress) {
        await edit(editingAddress.id, input);
        showToast("آدرس ویرایش شد", { variant: "success" });
      } else {
        await add(input);
        showToast("آدرس جدید اضافه شد", { variant: "success" });
      }
      setModalOpen(false);
    } catch {
      showToast("ذخیره آدرس انجام نشد. دوباره تلاش کنید.", { variant: "error" });
    }
  }

  async function handleDelete(address: PublicUserAddress) {
    try {
      await remove(address.id);
      showToast("آدرس حذف شد", { variant: "info" });
    } catch {
      showToast("حذف آدرس انجام نشد. دوباره تلاش کنید.", { variant: "error" });
    }
  }

  async function handleSetDefault(address: PublicUserAddress) {
    try {
      await makeDefault(address.id);
      showToast("آدرس پیش‌فرض تغییر کرد", { variant: "success" });
    } catch {
      showToast("عملیات انجام نشد. دوباره تلاش کنید.", { variant: "error" });
    }
  }

  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">آدرس‌های من</h2>
        {status === "ready" && addresses.length > 0 && (
          <Button onClick={openAddModal} className="h-10 px-3.5 text-xs sm:h-11 sm:px-4 sm:text-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            افزودن آدرس جدید
          </Button>
        )}
      </div>

      <div className="mt-6">
        {status === "loading" && <AddressesSkeleton />}

        {status === "error" && <ErrorState onRetry={reload} />}

        {status === "ready" && addresses.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <MapPin className="h-10 w-10 text-secondary-text" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-navy">هنوز آدرسی ثبت نکرده‌اید</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary-text">
                برای خریدهای بعدی می‌توانید آدرس‌های خانه، محل کار یا هر محل دیگری را ذخیره کنید.
              </p>
            </div>
            <Button onClick={openAddModal}>افزودن اولین آدرس</Button>
          </div>
        )}

        {status === "ready" && addresses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => openEditModal(address)}
                onSetDefault={() => handleSetDefault(address)}
                onDelete={() => handleDelete(address)}
              />
            ))}
          </div>
        )}
      </div>

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        address={editingAddress}
        autoDefault={!editingAddress && addresses.length === 0}
      />
    </div>
  );
}

function AddressesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border bg-white p-5"
        >
          <div className="h-4 w-1/3 rounded bg-medical-bg" />
          <div className="h-3 w-2/3 rounded bg-medical-bg" />
          <div className="h-3 w-1/2 rounded bg-medical-bg" />
          <div className="h-16 w-full rounded bg-medical-bg" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      <p className="text-sm text-accent-red">دریافت اطلاعات انجام نشد. دوباره تلاش کنید.</p>
      <Button variant="outline" onClick={onRetry}>
        تلاش دوباره
      </Button>
    </div>
  );
}
