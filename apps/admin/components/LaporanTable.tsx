"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Laporan } from "@scaff/database";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

const STATUS_META: Record<Laporan["status"], { label: string; cls: string }> = {
  baru: { label: "Baru", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  diproses: { label: "Diproses", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  selesai: { label: "Selesai", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const KATEGORI_LABEL: Record<Laporan["kategori"], string> = {
  bug: "Bug",
  saran: "Saran",
  lainnya: "Lainnya",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function LaporanTable({ initial }: { initial: Laporan[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<Laporan[]>(initial);
  const [filter, setFilter] = useState<"semua" | Laporan["status"]>("semua");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const filtered = filter === "semua" ? rows : rows.filter((r) => r.status === filter);
  const baruCount = rows.filter((r) => r.status === "baru").length;

  async function handleStatus(row: Laporan, status: Laporan["status"]) {
    if (row.status === status) return;
    setPending(row.id);
    const res = await apiFetch<{ laporan: Laporan }>(
      `/api/laporan/${encodeURIComponent(row.id)}`,
      { method: "PUT", body: JSON.stringify({ status }) }
    );
    setPending(null);
    if (!res.ok || !res.data) {
      toast.error(res.error || "Gagal mengubah status.");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? res.data!.laporan : r)));
    toast.success(`Status → ${STATUS_META[status].label}.`);
    router.refresh();
  }

  async function handleDelete(row: Laporan) {
    const ok = await confirm({
      title: "Hapus laporan?",
      message: `"${row.judul}" akan dihapus permanen dari database.`,
      confirmLabel: "Ya, hapus",
    });
    if (!ok) return;
    setPending(row.id);
    const res = await apiFetch(`/api/laporan/${encodeURIComponent(row.id)}`, { method: "DELETE" });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error || "Gagal menghapus laporan.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Laporan dihapus.");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["semua", "baru", "diproses", "selesai"] as const).map((s) => (
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
        {baruCount > 0 && (
          <span className="ml-auto font-mono text-xs text-amber-400">{baruCount} belum dibaca</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-zinc-400">
            {rows.length === 0 ? "Belum ada laporan masuk." : "Tidak ada laporan berstatus ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const open = openId === row.id;
            return (
              <article key={row.id} className="glass-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
                        {KATEGORI_LABEL[row.kategori]}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_META[row.status].cls}`}>
                        {STATUS_META[row.status].label}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-600">{formatDate(row.created_at)}</span>
                      {row.gambar_url && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-px text-[11px] text-zinc-400" title="Ada gambar bukti">
                          🖼
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-white">{row.judul}</h3>
                    {row.kontak && (
                      <p className="mt-1 font-mono text-xs text-zinc-500">Kontak: {row.kontak}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <select
                      value={row.status}
                      disabled={pending === row.id}
                      onChange={(e) => void handleStatus(row, e.target.value as Laporan["status"])}
                      aria-label={`Ubah status ${row.judul}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 [&>option]:bg-[#131316] disabled:opacity-50"
                    >
                      <option value="baru">Baru</option>
                      <option value="diproses">Diproses</option>
                      <option value="selesai">Selesai</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      disabled={pending === row.id}
                      className="btn-delete"
                      title={`Hapus ${row.judul}`}
                      aria-label={`Hapus ${row.judul}`}
                    >
                      <svg viewBox="0 0 448 512" aria-hidden="true"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : row.id)}
                  className="mt-2 text-xs font-medium text-[#A78BFA] hover:underline"
                >
                  {open ? "Sembunyikan detail ↑" : "Lihat detail ↓"}
                </button>
                {open && (
                  <>
                    {row.gambar_url && (
                      <a
                        href={row.gambar_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block overflow-hidden rounded-xl border border-white/10"
                        title="Buka gambar penuh"
                      >
                        <img
                          src={row.gambar_url}
                          alt={`Bukti laporan: ${row.judul}`}
                          loading="lazy"
                          className="max-h-64 w-full object-cover transition-transform hover:scale-[1.01]"
                        />
                      </a>
                    )}
                    <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-4 text-sm leading-relaxed text-zinc-300">
                      {row.isi}
                    </p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
