"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/admin/RequireRole";
import { listAuditLogs, type AuditLogEntry } from "@/lib/admin-api";

export default function AuditLogsPage() {
  return (
    <RequireRole role="super_admin">
      <AuditLogsContent />
    </RequireRole>
  );
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    listAuditLogs({ limit: 100 }).then((res) => setLogs(res.items));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">لاگ‌های حسابرسی</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-secondary-text">
              <th className="p-3 font-medium">زمان</th>
              <th className="p-3 font-medium">عملیات</th>
              <th className="p-3 font-medium">نوع</th>
              <th className="p-3 font-medium">شناسه</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="p-3 text-secondary-text">{new Date(log.createdAt).toLocaleString("fa-IR")}</td>
                <td className="p-3 text-navy">{log.action}</td>
                <td className="p-3 text-navy">{log.entityType}</td>
                <td className="p-3 text-xs text-secondary-text">{log.entityId ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-secondary-text">
                  رکوردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
