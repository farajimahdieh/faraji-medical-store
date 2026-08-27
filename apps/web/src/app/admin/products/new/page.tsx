"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { ApiError, listCategories, type PublicCategory } from "@/lib/api";
import { createAdminProduct } from "@/lib/admin-api";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  const rootCategories = categories.filter((c) => !c.parent);
  const childCategoriesByParentSlug = categories.reduce<Record<string, PublicCategory[]>>((acc, category) => {
    if (!category.parent) return acc;
    (acc[category.parent.slug] ??= []).push(category);
    return acc;
  }, {});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const product = await createAdminProduct({ name, categoryId: categoryId || undefined });
      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy">محصول جدید</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
        <TextField label="نام محصول" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
          دسته‌بندی
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 rounded-xl border border-border px-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">دسته‌بندی محصول را انتخاب کن</option>
            {rootCategories.map((root) => {
              const children = childCategoriesByParentSlug[root.slug];
              return children && children.length > 0 ? (
                <optgroup key={root.id} label={root.name}>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              );
            })}
          </select>
        </label>
        {error && <p className="text-sm text-accent-red">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "در حال ایجاد..." : "ایجاد و ادامه"}
        </Button>
      </form>
    </div>
  );
}
