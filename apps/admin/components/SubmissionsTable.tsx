"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Submission } from "@scaff/database";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";
import { ManualEmailDialog, type EmailNotificationPayload } from "@/components/ManualEmailDialog";
import { SubmissionReviewDrawer } from "@/components/SubmissionReviewDrawer";
import { parseAuditReport } from "@/lib/submission-audit";
import {
  STATUS_META,
  formatSubmissionDate,
  severityCls,
} from "@/lib/submission-ui";

type Filter = "perlu" | "semua" | Submission["status"];

export function SubmissionsTable({ initial }: { initial: Submission[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<Submission[]>(initial);
  const initialPending = initial.filter(
    (row) => row.status === "pending" || row.status === "auditing"
  ).length;
  const [filter, setFilter] = useState<Filter>(initialPending > 0 ? "perlu" : "semua");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState<EmailNotificationPayload | null>(null);
  const [redirectAfterEmail, setRedirectAfterEmail] = useState<string | null>(null);

  const pendingCount = rows.filter(
    (row) => row.status === "pending" || row.status === "auditing"
  ).length;
  const selected = rows.find((row) => row.id === openId) ?? null;

  const filtered =
    filter === "perlu"
      ? rows.filter((row) => row.status === "pending" || row.status === "auditing")
      : filter === "semua"
        ? rows
        : rows.filter((row) => row.status === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "perlu", label: `Perlu ditinjau (${pendingCount})` },
    { key: "semua", label: `Semua (${rows.length})` },
    { key: "needs_revision", label: `Perlu revisi (${rows.filter((r) => r.status === "needs_revision").length})` },
    { key: "accepted", label: `Diterima (${rows.filter((r) => r.status === "accepted").length})` },
    { key: "rejected", label: `Ditolak (${rows.filter((r) => r.status === "rejected").length})` },
    { key: "published", label: `Tayang (${rows.filter((r) => r.status === "published").length})` },
  ];

  async function update(
    row: Submission,
    patch: Record<string, unknown>,
    successMsg: string
  ): Promise<boolean> {
    setPending(row.id);
    const res = await apiFetch<{
      submission: Submission;
      notification?: EmailNotificationPayload;
    }>(`/api/submissions/${encodeURIComponent(row.id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    setPending(null);
    if (!res.ok || !res.data) {
      toast.error(res.error || "Gagal memperbarui submission.");
      return false;
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? res.data!.submission : item)));
    toast.success(successMsg);
    if (res.data.notification && res.data.notification.status !== "sent") {
      setManualEmail(res.data.notification);
      toast.info("Status tersimpan, tetapi email belum terkirim. Template pesan manual sudah disiapkan.");
    }
    router.refresh();
    return true;
  }

  async function accept(row: Submission) {
    const ok = await confirm({
      title: "Terima & buat draft?",
      message: `Template "${row.nama}" akan dibuat sebagai draft. Kamu masih perlu mirror repo dan publish manual.`,
      confirmLabel: "Ya, buat draft",
    });
    if (!ok) return;

    setPending(row.id);
    const res = await apiFetch<{
      ok: boolean;
      slug: string;
      notification?: EmailNotificationPayload;
    }>(`/api/submissions/${encodeURIComponent(row.id)}/accept`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setPending(null);
    if (!res.ok || !res.data?.slug) {
      toast.error(res.error || "Gagal menerima submission.");
      return;
    }

    toast.success("Draft template dibuat.");
    setOpenId(null);
    if (res.data.notification && res.data.notification.status !== "sent") {
      setManualEmail(res.data.notification);
      setRedirectAfterEmail(`/templates/${encodeURIComponent(res.data.slug)}/edit`);
      toast.info("Draft dibuat, tetapi email belum terkirim. Template pesan manual sudah disiapkan.");
      return;
    }
    router.push(`/templates/${encodeURIComponent(res.data.slug)}/edit`);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              filter === item.key
                ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-zinc-500">
        <span className="font-medium text-zinc-400">Alur review:</span>
        <span>1. Audit otomatis</span>
        <span className="text-zinc-700">→</span>
        <span>2. Cek manual</span>
        <span className="text-zinc-700">→</span>
        <span>3. Keputusan</span>
        <span className="ml-auto text-zinc-600">Audit statis bukan jaminan 100% aman.</span>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-zinc-400">
            {rows.length === 0
              ? "Belum ada submission masuk."
              : "Tidak ada submission di filter ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const report = parseAuditReport(row.audit_report);
            const meta = STATUS_META[row.status];
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setOpenId(row.id)}
                className="glass-panel group flex w-full flex-wrap items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.995] sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {row.framework} · {row.kategori}
                    </span>
                    {row.audit_severity && (
                      <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${severityCls(row.audit_severity)}`}>
                        {row.audit_severity}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-zinc-100">{row.nama}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {row.author_name} · {formatSubmissionDate(row.created_at)}
                  </p>
                </div>

                <div className="hidden min-w-[120px] text-right sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">Audit</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {report
                      ? report.highestSeverity ?? "Tanpa temuan"
                      : row.status === "pending"
                        ? "Belum dijalankan"
                        : "Belum ada hasil"}
                  </p>
                </div>

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                  <span className="text-[11px] text-zinc-500">{meta.action}</span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all group-hover:border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/10 group-hover:text-[#C4B5FD]">
                    Tinjau →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <SubmissionReviewDrawer
          key={selected.id}
          row={selected}
          onClose={() => setOpenId(null)}
          onUpdated={(updated) =>
            setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
          }
          onUpdate={(patch, message) => update(selected, patch, message)}
          onAccept={() => accept(selected)}
        />
      )}

      <ManualEmailDialog
        key={manualEmail?.subject ?? "none"}
        notification={manualEmail}
        onClose={() => {
          setManualEmail(null);
          if (redirectAfterEmail) {
            const target = redirectAfterEmail;
            setRedirectAfterEmail(null);
            router.push(target);
          }
        }}
      />
    </div>
  );
}
