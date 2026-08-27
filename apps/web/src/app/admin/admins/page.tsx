"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RequireRole } from "@/components/admin/RequireRole";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api";
import { createAdmin, listAdmins, setAdminActive, type AdminAccount } from "@/lib/admin-api";

export default function AdminsPage() {
  return (
    <RequireRole role="super_admin">
      <AdminsPageContent />
    </RequireRole>
  );
}

function AdminsPageContent() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    listAdmins().then(setAdmins);
  }

  useEffect(reload, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createAdmin({ phone, firstName, lastName, password });
      setPhone("");
      setFirstName("");
      setLastName("");
      setPassword("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(admin: AdminAccount) {
    await setAdminActive(admin.id, !admin.isActive);
    reload();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">مدیریت ادمین‌ها</h1>

      <div className="mb-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-secondary-text">
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">موبایل</th>
              <th className="p-3 font-medium">نقش</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-border last:border-0">
                <td className="p-3 text-navy">{admin.firstName} {admin.lastName}</td>
                <td className="p-3 text-navy">{admin.phone}</td>
                <td className="p-3 text-navy">{admin.role === "super_admin" ? "سوپر ادمین" : "ادمین"}</td>
                <td className="p-3">{admin.isActive ? "فعال" : "غیرفعال"}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(admin)} className="text-xs text-primary hover:underline">
                    {admin.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-bold text-navy">افزودن ادمین جدید</h2>
        <TextField label="شماره موبایل" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <TextField label="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <TextField label="نام خانوادگی" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <TextField
          label="رمز عبور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-accent-red">{error}</p>}
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "در حال ایجاد..." : "ایجاد ادمین"}
        </Button>
      </form>
    </div>
  );
}
