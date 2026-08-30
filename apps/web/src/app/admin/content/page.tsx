"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listContent, type SiteContentItem } from "@/lib/admin-api";

export default function AdminContentPage() {
  const [items, setItems] = useState<SiteContentItem[]>([]);

  useEffect(() => {
    listContent().then(setItems);
  }, []);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy">محتوا</h1>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={`/admin/content/${item.key}`}
            className="rounded-2xl border border-border bg-white p-4 transition-colors hover:border-primary"
          >
            <div className="font-medium text-navy">{item.title}</div>
            <div className="mt-1 truncate text-xs text-secondary-text">{item.body || "بدون محتوا"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
