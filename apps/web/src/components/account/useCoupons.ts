"use client";

import { useCallback, useEffect, useState } from "react";
import { listMyCoupons, type PublicDiscountCode } from "@/lib/api";

export type CouponsStatus = "loading" | "ready" | "error";

export function useCoupons() {
  const [status, setStatus] = useState<CouponsStatus>("loading");
  const [coupons, setCoupons] = useState<PublicDiscountCode[]>([]);

  // Mount fetch: setState only happens inside the promise handlers, never
  // synchronously in the effect body itself.
  useEffect(() => {
    listMyCoupons()
      .then((data) => {
        setCoupons(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await listMyCoupons();
      setCoupons(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  return { status, coupons, reload };
}
