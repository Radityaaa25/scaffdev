"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Integrasi } from "@scaff/database";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export function IntegrasiTable({ initial }: { initial: Integrasi[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<Integrasi[]>(initial);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      `${r.nama_tampilan} ${r.kode} ${r.kategori_integrasi ?? ""}`.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  async function handleDelete(r: Integrasi) {
    const ok = await confirm({
      title: "Hapus integrasi?",
      message: `"${r.nama_tampilan}" (${r.kode}) akan dihapus. Ditolak bila masih dipakai template.`,
      confirmLabel: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    setDeleting(r.kode);
    const res = await apiFetch<{ success: boolean }>(
      `/api/integrasi/${encodeURIComponent(r.kode)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      setDeleting(null);
      toast.error(res.error || "Gagal menghapus integrasi.");
      return;
    }
    setRows((prev) => prev.filter((x) => x.kode !== r.kode));
    setDeleting(null);
    toast.success(`Integrasi "${r.nama_tampilan}" dihapus.`);
    router.refresh();
  }

  return (
    <div className="animate-admin-enter">
      <div className="glass-panel mt-6 rounded-2xl p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau kode…"
          className="glass-input w-full rounded-xl px-4 py-2 text-sm sm:max-w-sm"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r, i) => (
          <div
            key={r.kode}
            className={`glass-panel animate-admin-enter group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 ${deleting === r.kode ? "pointer-events-none scale-95 opacity-0" : ""}`}
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">{r.nama_tampilan}</h3>
                <p className="font-mono text-xs text-zinc-500">{r.kode}</p>
              </div>
              {r.kategori_integrasi && (
                <span className="shrink-0 rounded-full bg-[#8B5CF6]/15 px-2.5 py-0.5 text-xs font-medium text-[#A78BFA]">
                  {r.kategori_integrasi}
                </span>
              )}
            </div>
            <p className="mt-3 font-mono text-xs text-zinc-500">
              {(r.daftar_env_var ?? []).length} env var
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/integrasi/${encodeURIComponent(r.kode)}/edit`}
                className="Btn"
              >
                Edit
                <svg className="svg" viewBox="0 0 512 512" aria-hidden="true">
                  <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(r)}
                disabled={deleting !== null}
                title={`Hapus ${r.nama_tampilan}`}
                aria-label={`Hapus ${r.nama_tampilan}`}
                className="btn-delete"
              >
                {deleting === r.kode ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg viewBox="0 0 448 512" aria-hidden="true"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                )}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-panel col-span-full rounded-2xl p-10 text-center">
            <p className="text-sm text-zinc-400">
              {rows.length === 0 ? "Belum ada integrasi." : "Tidak cocok dengan pencarian."}
            </p>
            {rows.length === 0 && (
              <Link href="/integrasi/new" className="mt-3 inline-block rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#7C3AED] active:scale-95">
                + Tambah yang pertama
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
