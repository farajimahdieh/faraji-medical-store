"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { updateWishlistNote } from "@/lib/api";
import { useToast } from "@/components/toast/ToastProvider";

const NOTE_EXAMPLES = ["برای مشورت با پزشک", "مقایسه با مدل دیگر", "بررسی برای خرید بعدی"];
const NOTE_MAX_LENGTH = 500;

interface WishlistNoteEditorProps {
  wishlistItemId: string;
  note: string | null;
  onChange: (note: string | null) => void;
}

export function WishlistNoteEditor({ wishlistItemId, note, onChange }: WishlistNoteEditorProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(note ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(note ?? "");
    setEditing(false);
  }

  async function persistNote(nextNote: string | null) {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateWishlistNote(wishlistItemId, nextNote);
      onChange(updated.note);
      setDraft(updated.note ?? "");
      setEditing(false);
    } catch {
      showToast("ذخیره یادداشت انجام نشد، دوباره تلاش کنید", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!editing && !note) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="w-fit text-xs font-medium text-primary hover:underline"
      >
        افزودن یادداشت
      </button>
    );
  }

  if (!editing && note) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-medical-bg px-3 py-2">
        <p className="flex-1 text-xs leading-6 whitespace-pre-line text-navy">{note}</p>
        <button
          type="button"
          onClick={startEdit}
          aria-label="ویرایش یادداشت"
          className="shrink-0 text-secondary-text transition-colors hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => persistNote(null)}
          disabled={saving}
          aria-label="حذف یادداشت"
          className="shrink-0 text-secondary-text transition-colors hover:text-accent-red disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  const trimmedDraft = draft.trim();
  const hasChanged = trimmedDraft !== (note ?? "").trim();

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value.slice(0, NOTE_MAX_LENGTH))}
        placeholder="مثلاً: برای مشورت با پزشک ذخیره کردم..."
        rows={2}
        maxLength={NOTE_MAX_LENGTH}
        className="w-full resize-none rounded-xl border border-border px-3 py-2 text-xs text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {NOTE_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setDraft(example)}
              className="rounded-full bg-medical-bg px-2 py-0.5 text-[11px] text-secondary-text transition-colors hover:text-primary"
            >
              {example}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-secondary-text">
          {draft.length.toLocaleString("fa-IR")} / {NOTE_MAX_LENGTH.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => persistNote(trimmedDraft.length > 0 ? trimmedDraft : null)}
          disabled={saving || !hasChanged}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره یادداشت"}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="text-xs font-medium text-secondary-text hover:text-navy"
        >
          انصراف
        </button>
        {note && (
          <button
            type="button"
            onClick={() => persistNote(null)}
            disabled={saving}
            className="text-xs font-medium text-accent-red hover:underline"
          >
            حذف یادداشت
          </button>
        )}
      </div>
    </div>
  );
}
