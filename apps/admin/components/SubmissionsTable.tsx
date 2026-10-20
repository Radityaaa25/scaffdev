"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Submission } from "@scaff/database";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

const STATUS_META: Record<Submission["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  auditing: { label: "Auditing", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  needs_revision: { label: "Perlu Revisi", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  accepted: { label: "Diterima", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Ditolak", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  published: { label: "Published", cls: "bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30" },
};

const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function severityCls(sev: string | null): string {
  if (sev === "HIGH" || sev === "CRITICAL") return "text-red-300 border-red-500/30 bg-red-500/10";
  if (sev === "MEDIUM") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  if (sev === "LOW" || sev === "INFO") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  return "text-zinc-400 border-white/10 bg-white/5";
}

export function SubmissionsTable({ initial }: { initial: Submission[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<Submission[]>(initial);
  const [filter, setFilter] = useState<"semua" | Submission["status"]>("semua");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [commit, setCommit] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [note, setNote] = useState("");

  const filtered = filter === "semua" ? rows : rows.filter((r) => r.status === filter);
  const pendingCount = rows.filter((r) => r.status === "pending" || r.status === "auditing").length;

  function open(row: Submission) {
    setOpenId(openId === row.id ? null : row.id);
    setCommit(row.audit_commit ?? "");
    setSeverity(row.audit_severity ?? "");
    setNote(row.review_note ?? "");
  }

  async function update(row: Submission, patch: Record<string, unknown>, successMsg: string) {
    setPending(row.id);
    const res = await apiFetch<{ submission: Submission }>(
      `/api/submissions/${encodeURIComponent(row.id)}`,
      { method: "PUT", body: JSON.stringify(patch) }
    );
    setPending(null);
    if (!res.ok || !res.data) {
      toast.error(res.error || "Gagal memperbarui submission.");
      return false;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? res.data!.submission : r)));
    toast.success(successMsg);
    router.refresh();
    return true;
  }

  async function saveAudit(row: Submission) {
    const ok = await update(
      row,
      {
        audit_commit: commit.trim(),
        audit_severity: severity,
        review_note: note,
      },
      "Hasil audit disimpan."
    );
    if (ok) setOpenId(null);
  }

  async function accept(row: Submission) {
    if (!commit.trim() && !row.audit_commit) {
      toast.error("Isi commit audit dulu, lalu simpan.");
      return;
    }
    const ok = await confirm({
      title: "Terima & buat draft?",
      message: `Template "${row.nama}" akan dibuat sebagai draft. Kamu masih perlu mirror repo dan publish manual.`,
      confirmLabel: "Ya, buat draft",
    });
    if (!ok) return;
    setPending(row.id);
    const res = await apiFetch<{ ok: boolean; slug: string }>(
      `/api/submissions/${encodeURIComponent(row.id)}/accept`,
      { method: "POST", body: JSON.stringify({}) }
    );
    setPending(null);
    if (!res.ok || !res.data?.slug) {
      toast.error(res.error || "Gagal menerima submission.");
      return;
    }
    toast.success("Draft template dibuat.");
    router.push(`/templates/${encodeURIComponent(res.data.slug)}/edit`);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["semua", "pending", "auditing", "needs_revision", "accepted", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              filter === s
                ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            {s === "semua" ? `Semua (${rows.length})` : `${STATUS_META[s].label} (${rows.filter((r) => r.status === s).length})`}
          </button>
        ))}
        {pendingCount > 0 && <span className="ml-auto font-mono text-xs text-amber-400">{pendingCount} perlu ditinjau</span>}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-zinc-400">
            {rows.length === 0 ? "Belum ada submission masuk." : "Tidak ada submission berstatus ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const isOpen = openId === row.id;
            return (
              <article key={row.id} className="glass-panel rounded-2xl p-5">
                <button type="button" onClick={() => open(row)} className="flex w-full flex-wrap items-start gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_META[row.status].cls}`}>
                        {STATUS_META[row.status].label}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">{row.framework} · {row.kategori}</span>
                      {row.audit_severity && (
                        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${severityCls(row.audit_severity)}`}>
                          {row.audit_severity}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-semibold text-zinc-100">{row.nama}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {row.author_name} · {formatDate(row.created_at)} · {row.contact_email}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">{isOpen ? "Tutup ▲" : "Detail ▼"}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    <p className="text-sm leading-relaxed text-zinc-300">{row.deskripsi || "Tanpa deskripsi."}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <a href={row.repo_url} target="_blank" rel="noreferrer" className="text-[#A78BFA] hover:underline">Repo asli ↗</a>
                      {row.preview_url && <a href={row.preview_url} target="_blank" rel="noreferrer" className="text-[#A78BFA] hover:underline">Demo ↗</a>}
                      {row.screenshot_url && <a href={row.screenshot_url} target="_blank" rel="noreferrer" className="text-[#A78BFA] hover:underline">Screenshot ↗</a>}
                      {row.author_url && <a href={row.author_url} target="_blank" rel="noreferrer" className="text-[#A78BFA] hover:underline">Profil author ↗</a>}
                    </div>
                    {row.opsi_integrasi.length > 0 && (
                      <p className="font-mono text-xs text-zinc-500">Integrasi: {row.opsi_integrasi.join(", ")}</p>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-400">Commit audit (SHA)</label>
                        <input value={commit} onChange={(e) => setCommit(e.target.value)} placeholder="a1b2c3d…" className="glass-input w-full rounded-xl px-3 py-2 font-mono text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-400">Severity tertinggi</label>
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="glass-input w-full rounded-xl px-3 py-2 text-xs [&>option]:bg-[#131316]">
                          <option value="">— belum —</option>
                          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-zinc-400">Catatan review</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Hasil audit, revisi yang diminta, alasan reject…" className="glass-input w-full resize-y rounded-xl px-3 py-2 text-xs" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={pending === row.id} onClick={() => saveAudit(row)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-60">
                        Simpan Audit
                      </button>
                      <button type="button" disabled={pending === row.id} onClick={() => update(row, { status: "auditing" }, "Status → Auditing.")} className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20 disabled:opacity-60">
                        Mulai Audit
                      </button>
                      <button type="button" disabled={pending === row.id} onClick={() => update(row, { status: "needs_revision", review_note: note }, "Status → Perlu Revisi.")} className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-300 hover:bg-orange-500/20 disabled:opacity-60">
                        Minta Revisi
                      </button>
                      <button type="button" disabled={pending === row.id} onClick={() => update(row, { status: "rejected", review_note: note }, "Submission ditolak.")} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60">
                        Tolak
                      </button>
                      <button type="button" disabled={pending === row.id} onClick={() => accept(row)} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-60">
                        {pending === row.id ? "Memproses…" : "Terima & Buat Draft"}
                      </button>
                      {row.template_slug && (
                        <a href={`/templates/${encodeURIComponent(row.template_slug)}/edit`} className="rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-2 text-xs font-medium text-[#C4B5FD] hover:bg-[#8B5CF6]/20">
                          Edit Draft →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
