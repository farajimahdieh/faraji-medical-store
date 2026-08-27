"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  addProductVariant,
  deleteProductImage,
  getAdminProduct,
  removeProductVariant,
  reorderProductImages,
  replaceProductImage,
  updateAdminProduct,
  updateProductImage,
  updateProductVariant,
  uploadProductImages,
  type AdminProductDetail,
} from "@/lib/admin-api";
import { PRODUCT_STATUS_LABELS } from "@/lib/product-status";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    getAdminProduct(id).then(setProduct).catch((err) => setError(err instanceof ApiError ? err.message : "خطایی رخ داد"));
  }

  useEffect(reload, [id]);

  if (error) return <p className="text-sm text-accent-red">{error}</p>;
  if (!product) return <p className="text-sm text-secondary-text">در حال بارگذاری...</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold text-navy">ویرایش محصول</h1>
      <ProductForm product={product} onSaved={reload} setSaving={setSaving} />
      <ImagesPanel product={product} onChanged={reload} />
      <VariantsPanel product={product} onChanged={reload} />
      <Button type="submit" form={PRODUCT_FORM_ID} disabled={saving} className="self-start">
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </Button>
    </div>
  );
}

const PRODUCT_FORM_ID = "product-edit-form";

// The submit button is rendered by the parent, after the images/variants
// panels (per the requested layout), and targets this form by id/`saving`
// is lifted up so that button can show the right label/disabled state.
function ProductForm({
  product,
  onSaved,
  setSaving,
}: {
  product: AdminProductDetail;
  onSaved: () => void;
  setSaving: (saving: boolean) => void;
}) {
  const [name, setName] = useState(product.name);
  const [shortDescription, setShortDescription] = useState(product.shortDescription ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateAdminProduct(product.id, { name, shortDescription, description });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      id={PRODUCT_FORM_ID}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-secondary-text">وضعیت:</span>
        <span className="rounded-full bg-medical-bg px-3 py-1 text-xs font-medium text-primary">
          {PRODUCT_STATUS_LABELS[product.status]}
        </span>
        <span className="text-xs text-secondary-text">
          (تغییر وضعیت فقط از طریق بخش «محصولات در انتظار بررسی» انجام می‌شود)
        </span>
      </div>
      {product.rejectionReason && (
        <p className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-3 py-2 text-sm text-accent-red">
          دلیل رد شدن در بررسی قبلی: {product.rejectionReason}
        </p>
      )}
      <TextField label="نام محصول" value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField
        label="توضیح کوتاه"
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
      />
      <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
        توضیحات کامل
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="rounded-xl border border-border p-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </label>
      {error && <p className="text-sm text-accent-red">{error}</p>}
    </form>
  );
}

function ImagesPanel({ product, onChanged }: { product: AdminProductDetail; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      await uploadProductImages(product.id, Array.from(files));
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    }
  }

  async function handleReplace(imageId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      await replaceProductImage(product.id, imageId, files[0]);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    }
  }

  async function handleSetPrimary(imageId: string) {
    await updateProductImage(product.id, imageId, { isPrimary: true });
    onChanged();
  }

  async function handleDelete(imageId: string) {
    await deleteProductImage(product.id, imageId);
    onChanged();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderProductImages(product.id, reordered.map((img) => img.id));
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-navy">تصاویر محصول</h2>
        <label className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-medical-bg">
          افزودن عکس
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </label>
      </div>
      {error && <p className="mb-3 text-sm text-accent-red">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.id} className="flex flex-col gap-2 rounded-xl border border-border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(image.url)} alt={image.altText ?? ""} className="aspect-square w-full rounded-lg object-cover" />
            {image.isPrimary && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-center text-xs font-medium text-primary">
                تصویر اصلی
              </span>
            )}
            <div className="flex flex-wrap gap-1 text-xs">
              {!image.isPrimary && (
                <button onClick={() => handleSetPrimary(image.id)} className="text-primary hover:underline">
                  تعیین به‌عنوان اصلی
                </button>
              )}
              <button onClick={() => handleMove(index, -1)} className="text-navy hover:underline">
                ▲
              </button>
              <button onClick={() => handleMove(index, 1)} className="text-navy hover:underline">
                ▼
              </button>
              <label className="cursor-pointer text-navy hover:underline">
                جایگزینی
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplace(image.id, e.target.files)} />
              </label>
              <button onClick={() => handleDelete(image.id)} className="text-accent-red hover:underline">
                حذف
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-secondary-text">هنوز عکسی اضافه نشده است.</p>}
      </div>
    </div>
  );
}

function VariantsPanel({ product, onChanged }: { product: AdminProductDetail; onChanged: () => void }) {
  const [size, setSize] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addProductVariant(product.id, { size });
      setSize("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    }
  }

  async function handleToggleActive(variantId: string, isActive: boolean) {
    await updateProductVariant(product.id, variantId, { isActive });
    onChanged();
  }

  async function handleRemove(variantId: string) {
    await removeProductVariant(product.id, variantId);
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-1 font-bold text-navy">سایزها / Variantها</h2>
      <p className="mb-4 text-xs text-secondary-text">
        قیمت فقط از طریق همگام‌سازی حسابداری به‌روزرسانی می‌شود و در اینجا قابل ویرایش نیست.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-right text-secondary-text">
            <th className="p-2 font-medium">سایز</th>
            <th className="p-2 font-medium">قیمت</th>
            <th className="p-2 font-medium">فعال</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {product.variants.map((variant) => (
            <tr key={variant.id} className="border-b border-border last:border-0">
              <td className="p-2 text-navy">{variant.size}</td>
              <td className="p-2 text-secondary-text">{variant.price ?? "—"}</td>
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(e) => handleToggleActive(variant.id, e.target.checked)}
                />
              </td>
              <td className="p-2">
                <button onClick={() => handleRemove(variant.id)} className="text-xs text-accent-red hover:underline">
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={handleAdd} className="mt-4 flex items-end gap-3">
        <TextField label="سایز جدید" value={size} onChange={(e) => setSize(e.target.value)} required />
        <Button type="submit">افزودن</Button>
      </form>
      {error && <p className="mt-2 text-sm text-accent-red">{error}</p>}
    </div>
  );
}
