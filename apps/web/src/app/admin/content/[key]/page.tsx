"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api";
import { getContent, updateContent, type SiteContentItem } from "@/lib/admin-api";

export default function EditContentPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [content, setContent] = useState<SiteContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContent(key).then((c) => {
      setContent(c);
      setTitle(c.title);
      setBody(c.body);
    });
  }, [key]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateContent(key, { title, body });
      router.push("/admin/content");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  }

  if (!content) return <p className="text-sm text-secondary-text">در حال بارگذاری...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy">ویرایش محتوا</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
        <TextField label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
          متن
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="rounded-xl border border-border p-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        {error && <p className="text-sm text-accent-red">{error}</p>}
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </form>
    </div>
  );
}
