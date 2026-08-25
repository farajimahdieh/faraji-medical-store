"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressInput,
  type PublicUserAddress,
} from "@/lib/api";

export type AddressesStatus = "loading" | "ready" | "error";

// Every mutation re-fetches the full list rather than patching local state --
// the backend owns the "exactly one default" invariant (including promoting
// a new default after a delete), and a personal address book is small enough
// that a refetch is cheap and guarantees the UI never drifts from the server.
export function useAddresses() {
  const [status, setStatus] = useState<AddressesStatus>("loading");
  const [addresses, setAddresses] = useState<PublicUserAddress[]>([]);

  // Mount fetch: setState only happens inside the promise handlers, never
  // synchronously in the effect body itself.
  useEffect(() => {
    listAddresses()
      .then((data) => {
        setAddresses(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await listAddresses();
      setAddresses(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  async function add(input: AddressInput): Promise<void> {
    await createAddress(input);
    await reload();
  }

  async function edit(id: string, input: Partial<AddressInput>): Promise<void> {
    await updateAddress(id, input);
    await reload();
  }

  async function remove(id: string): Promise<void> {
    await deleteAddress(id);
    await reload();
  }

  async function makeDefault(id: string): Promise<void> {
    await setDefaultAddress(id);
    await reload();
  }

  return { status, addresses, reload, add, edit, remove, makeDefault };
}
