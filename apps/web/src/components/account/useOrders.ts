"use client";

import { useCallback, useEffect, useState } from "react";
import { listOrders, type PublicOrderSummary } from "@/lib/api";

export type OrdersStatus = "loading" | "ready" | "error";

export function useOrders() {
  const [status, setStatus] = useState<OrdersStatus>("loading");
  const [orders, setOrders] = useState<PublicOrderSummary[]>([]);

  // Mount fetch: setState only happens inside the promise handlers, never
  // synchronously in the effect body itself.
  useEffect(() => {
    listOrders({ limit: 50 })
      .then((data) => {
        setOrders(data.items);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await listOrders({ limit: 50 });
      setOrders(data.items);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  return { status, orders, reload };
}
