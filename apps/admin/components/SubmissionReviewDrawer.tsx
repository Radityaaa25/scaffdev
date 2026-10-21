"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Submission } from "@scaff/database";
import type { Severity } from "@scaff/security-audit";
import { useUI } from "@/components/UIProvider";
import { AuditReportView } from "@/components/AuditReportView";
import {
  MANUAL_CHECKLIST,
  parseAuditReport,
  type SubmissionAuditReport,
} from "@/lib/submission-audit";
import {
  STATUS_META,
  formatSubmissionDate,
  severityCls,
} from "@/lib/submission-ui";

const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function mergeManual(
  report: SubmissionAuditReport | null,
  checklist: Record<string, boolean>
): SubmissionAuditReport | null {
  if (!report) return null;
  return {
    ...report,
    manual: { checklist, reviewedAt: new Date().toISOString() },
  };
}

interface Props {
  row: Submission;
  onClose: () => void;
  onUpdated: (row: Submission) => void;
  onUpdate: (patch: Record<string, unknown>, successMsg: string) => Promise<boolean>;
  onAccept: () => Promise<void>;
}

export function SubmissionReviewDrawer({ row, onClose, onUpdated, onUpdate, onAccept }: Props) {
  const { toast, confirm } = useUI();
  const initialReport = parseAuditReport(row.audit_report);
  const [commit, setCommit] = useState(row.audit_commit ?? initialReport?.commit ?? "");
  const [severity, setSeverity] = useState<Severity | "">(
    row.audit_severity ?? initialReport?.highestSeverity ?? ""
  );
  const [note, setNote] = useState(row.review_note ?? "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    initialReport?.manual?.checklist ?? {}
  );
  const [advanced, setAdvanced] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busyAction, setBusyAction] = useState<"save" | "revision" | "reject" | "accept" | null>(
    null
  );
  const autoTried = useRef(false);
  const report = parseAuditReport(row.audit_report);
  const meta = STATUS_META[row.status];
  const checkedCount = MANUAL_CHECKLIST.filter((item) => checklist[item.id]).length;
  const dirty = note.trim() !== (row.review_note ?? "").trim();

  const runAudit = useCallback(async () => {
    setAuditBusy(true);
    setAuditError(null);
    setElapsed(0);
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(row.id)}/audit`, {
        method: "POST",
      });
      type AuditResponse = {
        submission?: Submission;
        error?: string;
        ai?: { status?: string };
      };
      let payload: AuditResponse | null = null;
      try {
        payload = (await res.json()) as AuditResponse;
      } catch {
        /* body kosong */
      }
      if (!res.ok || !payload?.submission) {
        setAuditError(payload?.error || `Audit gagal (HTTP ${res.status}).`);
        return;
      }
      const updated = payload.submission;
      onUpdated(updated);
      setCommit(updated.audit_commit ?? "");
      setSeverity(updated.audit_severity ?? "");
      const next = parseAuditReport(updated.audit_report);
      setChecklist(next?.manual?.checklist ?? {});
      if (payload.ai?.status === "ok") {
        toast.success("Audit otomatis selesai. Hasil dan ringkasan AI sudah disiapkan.");
      } else {
        toast.info("Audit statis selesai. Ringkasan AI tidak tersedia, cek temuan manual.");
      }
    } catch {
      setAuditError("Tidak dapat menghubungi server audit. Coba lagi.");
    } finally {
      setAuditBusy(false);
    }
  }, [onUpdated, row.id, toast]);

  const runAuditRef = useRef(runAudit);
  useEffect(() => {
    runAuditRef.current = runAudit;
  }, [runAudit]);

  // Audit otomatis hanya sekali saat panel dibuka untuk submission baru.
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const existing = parseAuditReport(row.audit_report);
    if (row.status === "pending" && !existing) {
      const timer = window.setTimeout(() => void runAuditRef.current(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [row.audit_report, row.status]);

  useEffect(() => {
    if (!auditBusy) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [auditBusy]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  async function requestClose() {
    if (auditBusy) {
      toast.info("Tunggu audit selesai sebelum menutup panel.");
      return;
    }
    if (dirty) {
      const ok = await confirm({
        title: "Tutup tanpa menyimpan?",
        message: "Catatan review yang belum disimpan akan hilang.",
        confirmLabel: "Tutup",
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // requestClose sengaja memakai state terbaru lewat closure render ini.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditBusy, dirty]);

  function reviewPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = {
      audit_commit: commit.trim(),
      audit_severity: severity,
      review_note: note,
    };
    const next = mergeManual(report, checklist);
    if (next) patch.audit_report = next;
    return patch;
  }

  function validateCommit(): boolean {
    if (commit.trim() && !/^[a-f0-9]{7,64}$/i.test(commit.trim())) {
      toast.error("Commit audit harus SHA heksadesimal 7-64 karakter.");
      return false;
    }
    return true;
  }

  async function saveReview() {
    if (!validateCommit()) return;
    setBusyAction("save");
    const ok = await onUpdate(reviewPatch(), "Review manual disimpan.");
    setBusyAction(null);
    if (ok) toast.success("Review manual tersimpan.");
  }

  async function decide(status: "needs_revision" | "rejected") {
    if (note.trim().length < 10) {
      toast.error("Tulis alasan minimal 10 karakter agar kontributor tahu yang harus diperbaiki.");
      return;
    }
    if (!validateCommit()) return;
    const label = status === "rejected" ? "Tolak submission?" : "Minta revisi?";
    const ok = await confirm({
      title: label,
      message:
        status === "rejected"
          ? "Status ditolak dan email pemberitahuan akan dikirim ke kontributor."
          : "Status berubah menjadi perlu revisi dan email berisi catatan akan dikirim ke kontributor.",
      confirmLabel: status === "rejected" ? "Ya, tolak" : "Ya, minta revisi",
      danger: status === "rejected",
    });
    if (!ok) return;
    setBusyAction(status === "rejected" ? "reject" : "revision");
    const updated = await onUpdate(
      { ...reviewPatch(), status },
      status === "rejected" ? "Submission ditolak." : "Status → Perlu Revisi."
    );
    setBusyAction(null);
    if (updated) onClose();
  }

  async function accept() {
    if (!commit.trim()) {
      toast.error("Commit audit belum terisi. Jalankan audit otomatis atau isi SHA manual.");
      return;
    }
    if (!validateCommit()) return;
    if (severity === "HIGH" || severity === "CRITICAL") {
      toast.error("Temuan HIGH/CRITICAL tidak boleh diterima tanpa perbaikan.");
      return;
    }
    if (!report) {
      const ok = await confirm({
        title: "Belum ada audit otomatis",
        message:
          "Submission ini belum punya hasil audit otomatis. Lanjutkan menerima dengan audit manual?",
        confirmLabel: "Lanjut",
        danger: true,
      });
      if (!ok) return;
    }
    setBusyAction("accept");
    const saved = await onUpdate(reviewPatch(), "Review disimpan.");
    setBusyAction(null);
    if (!saved) return;
    await onAccept();
  }

  return (
    <div className="animate-admin-backdrop fixed inset-0 z-[80] flex justify-end bg-black/65 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Tutup panel review"
        onClick={() => void requestClose()}
        className="absolute inset-0 cursor-default"
      />
      <aside
        className="animate-admin-popup relative flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#101012] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-review-title"
      >
        <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
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
              <h2 id="submission-review-title" className="mt-2 truncate text-lg font-bold text-white">
                {row.nama}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {row.author_name} · {formatSubmissionDate(row.created_at)} · {row.contact_email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void requestClose()}
              aria-label="Tutup"
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <ol className="mt-4 grid grid-cols-4 gap-1 text-[10px] font-medium">
            {["Ringkasan", "Audit otomatis", "Review manual", "Keputusan"].map((label, index) => (
              <li
                key={label}
                className={`rounded-md border px-2 py-1.5 text-center ${
                  index === 0
                    ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD]"
                    : "border-white/5 bg-white/[0.02] text-zinc-500"
                }`}
              >
                <span className="mr-1 font-mono">{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <section>
            <h3 className="text-sm font-bold text-zinc-100">1. Ringkasan submission</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
              {row.deskripsi || "Tanpa deskripsi."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a href={row.repo_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#C4B5FD] hover:bg-white/10">
                Repo asli ↗
              </a>
              {row.preview_url && (
                <a href={row.preview_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#C4B5FD] hover:bg-white/10">
                  Demo ↗
                </a>
              )}
              {row.screenshot_url && (
                <a href={row.screenshot_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#C4B5FD] hover:bg-white/10">
                  Screenshot ↗
                </a>
              )}
              {row.author_url && (
                <a href={row.author_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 hover:bg-white/10">
                  Profil author ↗
                </a>
              )}
            </div>
            {row.opsi_integrasi.length > 0 && (
              <p className="mt-3 font-mono text-[11px] text-zinc-500">
                Integrasi: {row.opsi_integrasi.join(", ")}
              </p>
            )}
            {row.template_slug && (
              <a
                href={`/templates/${encodeURIComponent(row.template_slug)}/edit`}
                className="mt-4 inline-flex rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#C4B5FD] hover:bg-[#8B5CF6]/20"
              >
                Edit draft template →
              </a>
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-zinc-100">2. Audit otomatis</h3>
              <span className="text-[11px] text-zinc-600">Read-only, tanpa menjalankan kode repo</span>
            </div>
            <AuditReportView
              report={report}
              busy={auditBusy}
              elapsed={elapsed}
              error={auditError}
              onRun={() => void runAudit()}
            />
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-zinc-100">3. Review manual</h3>
              <span className="text-[11px] text-zinc-500">
                {checkedCount}/{MANUAL_CHECKLIST.length} checklist
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {MANUAL_CHECKLIST.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[item.id])}
                    onChange={(event) =>
                      setChecklist((prev) => ({ ...prev, [item.id]: event.target.checked }))
                    }
                    className="mt-0.5 h-3.5 w-3.5 accent-[#8B5CF6]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="review-note" className="text-xs font-medium text-zinc-400">
                  Catatan review
                </label>
                <span className="font-mono text-[10px] text-zinc-600">{note.length}/2000</span>
              </div>
              <textarea
                id="review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Hasil cek manual, bagian yang perlu diperbaiki, atau alasan keputusan."
                className="glass-input w-full resize-y rounded-xl px-3 py-2.5 text-xs leading-relaxed"
              />
              <p className="mt-1.5 text-[11px] text-zinc-600">
                Wajib minimal 10 karakter untuk Minta Revisi atau Tolak, karena catatan ini ikut dikirim ke kontributor.
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <button
                type="button"
                onClick={() => setAdvanced((value) => !value)}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                {advanced ? "Sembunyikan data audit" : "Ubah commit / severity manual"}
              </button>
              {advanced && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="audit-commit" className="mb-1 block text-xs font-medium text-zinc-400">
                      Commit audit (SHA)
                    </label>
                    <input
                      id="audit-commit"
                      value={commit}
                      onChange={(event) => setCommit(event.target.value)}
                      placeholder="a1b2c3d…"
                      className="glass-input w-full rounded-xl px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="audit-severity" className="mb-1 block text-xs font-medium text-zinc-400">
                      Severity tertinggi
                    </label>
                    <select
                      id="audit-severity"
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value as Severity | "")}
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs [&>option]:bg-[#131316]"
                    >
                      <option value="">— belum —</option>
                      {SEVERITIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={busyAction !== null || auditBusy}
              onClick={() => void saveReview()}
              className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 transition-all hover:bg-white/10 disabled:opacity-60"
            >
              {busyAction === "save" ? "Menyimpan…" : "Simpan review manual"}
            </button>
          </section>

          <section>
            <h3 className="text-sm font-bold text-zinc-100">4. Keputusan</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Terima hanya setelah audit otomatis selesai dan review manual yakin. Keputusan revision/tolak
              mengirim email ke kontributor.
            </p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                disabled={busyAction !== null || auditBusy}
                onClick={() => void decide("needs_revision")}
                className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-left transition-all hover:bg-orange-500/15 disabled:opacity-60"
              >
                <span className="block text-xs font-semibold text-orange-300">Minta Revisi</span>
                <span className="mt-0.5 block text-[11px] text-orange-200/60">
                  Kirim catatan ke kontributor dan tunggu perbaikan.
                </span>
              </button>
              <button
                type="button"
                disabled={busyAction !== null || auditBusy}
                onClick={() => void decide("rejected")}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left transition-all hover:bg-red-500/15 disabled:opacity-60"
              >
                <span className="block text-xs font-semibold text-red-300">Tolak</span>
                <span className="mt-0.5 block text-[11px] text-red-200/60">
                  Hentikan submission. Email alasan penolakan ikut dikirim.
                </span>
              </button>
              <button
                type="button"
                disabled={
                  busyAction !== null ||
                  auditBusy ||
                  !commit.trim() ||
                  severity === "HIGH" ||
                  severity === "CRITICAL"
                }
                onClick={() => void accept()}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-left shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="block text-xs font-bold text-white">
                  {busyAction === "accept" ? "Memproses…" : "Terima & Buat Draft"}
                </span>
                <span className="mt-0.5 block text-[11px] text-emerald-950/70">
                  {severity === "HIGH" || severity === "CRITICAL"
                    ? "Dinonaktifkan: temuan HIGH/CRITICAL harus diperbaiki dulu."
                    : !commit.trim()
                      ? "Dinonaktifkan: commit audit belum terisi."
                      : "Buat draft template; mirror dan publish tetap manual."}
                </span>
              </button>
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-[#0c0c0e]/95 px-5 py-3 text-[11px] text-zinc-600 sm:px-6">
          Status: <span className="text-zinc-400">{meta.label}</span> · {meta.action}. Audit bukan jaminan
          100% aman.
        </footer>
      </aside>
    </div>
  );
}
