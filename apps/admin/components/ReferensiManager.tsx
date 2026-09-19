"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export interface ReferensiRow {
  kode: string;
  nama_tampilan: string;
  dipakai: number;
}

type Kind = "framework" | "kategori";

const KIND_META: Record<Kind, { plural: string; singular: string; endpoint: string; hint: string }> = {
  framework: {
    plural: "Framework",
    singular: "framework",
    endpoint: "/api/frameworks",
    hint: "Contoh: astro, remix, hono. Kode dipakai di slug & command CLI.",
  },
  kategori: {
    plural: "Kategori",
    singular: "kategori",
    endpoint: "/api/kategoris",
    hint: "Contoh: company-profile, blog, dashboard. Kode dipakai di slug & filter URL.",
  },
};

const inputCls = "glass-input w-full rounded-xl px-4 py-2.5 text-sm transition-all";
const KODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function ReferensiManager({
  initialFrameworks,
  initialKategoris,
}: {
  initialFrameworks: ReferensiRow[];
  initialKategoris: ReferensiRow[];
}) {
  const [tab, setTab] = useState<Kind>("framework");
  return (
    <div className="animate-admin-enter mt-6" style={{ animationDelay: "60ms" }}>
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 sm:max-w-md">
        {(Object.keys(KIND_META) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              tab === k ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25" : "text-zinc-400 hover:text-white"
            }`}
          >
            {KIND_META[k].plural}
          </button>
        ))}
      </div>

      {/* key={tab} memaksa remount saat ganti tab — tanpa ini state tabel
          tertinggal dari tab sebelumnya (React memakai ulang instance
          komponen yang sama). */}
      <ReferensiSection
        key={tab}
        kind={tab}
        initial={tab === "framework" ? initialFrameworks : initialKategoris}
      />
    </div>
  );
}

function ReferensiSection({ kind, initial }: { kind: Kind; initial: ReferensiRow[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const meta = KIND_META[kind];
  const [rows, setRows] = useState<ReferensiRow[]>(initial);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fail(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const k = kode.trim().toLowerCase();
    if (!k || !KODE_RE.test(k)) {
      return fail("Kode hanya boleh huruf kecil, angka, dan dash (contoh: company-profile).");
    }
    if (!nama.trim()) return fail("Nama tampilan wajib diisi.");
    setPending(true);
    const res = await apiFetch<{ [key: string]: ReferensiRow }>(meta.endpoint, {
      method: "POST",
      body: JSON.stringify({ kode: k, nama_tampilan: nama.trim() }),
    });
    setPending(false);
    if (!res.ok || !res.data) return fail(res.error || `Gagal menambah ${meta.singular}.`);
    const created = (res.data as Record<string, ReferensiRow>)[meta.singular];
    setRows((prev) => [...prev, { ...created, dipakai: 0 }].sort((a, b) => a.nama_tampilan.localeCompare(b.nama_tampilan)));
    setKode("");
    setNama("");
    toast.success(`"${created.nama_tampilan}" tersimpan — langsung jadi opsi form & filter.`);
    router.refresh();
  }

  function startEdit(row: ReferensiRow) {
    setEditing(row.kode);
    setEditNama(row.nama_tampilan);
    setError(null);
  }

  async function saveEdit(row: ReferensiRow) {
    setError(null);
    if (!editNama.trim()) return fail("Nama tampilan wajib diisi.");
    setPending(true);
    const res = await apiFetch<{ [key: string]: ReferensiRow }>(
      `${meta.endpoint}/${encodeURIComponent(row.kode)}`,
      { method: "PUT", body: JSON.stringify({ nama_tampilan: editNama.trim() }) }
    );
    setPending(false);
    if (!res.ok || !res.data) return fail(res.error || "Gagal menyimpan perubahan.");
    const updated = (res.data as Record<string, ReferensiRow>)[meta.singular];
    setRows((prev) =>
      prev.map((r) => (r.kode === row.kode ? { ...r, nama_tampilan: updated.nama_tampilan } : r))
        .sort((a, b) => a.nama_tampilan.localeCompare(b.nama_tampilan))
    );
    setEditing(null);
    toast.success("Perubahan tersimpan.");
    router.refresh();
  }

  async function handleDelete(row: ReferensiRow) {
    const ok = await confirm({
      title: `Hapus ${meta.singular}?`,
      message: `"${row.nama_tampilan}" (${row.kode}) akan dihapus permanen.${row.dipakai > 0 ? ` Saat ini dipakai ${row.dipakai} template.` : ""}`,
      confirmLabel: "Ya, hapus",
    });
    if (!ok) return;
    setError(null);
    const res = await apiFetch(`${meta.endpoint}/${encodeURIComponent(row.kode)}`, { method: "DELETE" });
    if (!res.ok) {
      setError(res.error || `Gagal menghapus ${meta.singular}.`);
      toast.error(res.error || `Gagal menghapus ${meta.singular}.`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.kode !== row.kode));
    toast.success(`"${row.nama_tampilan}" dihapus.`);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Form tambah */}
      <form onSubmit={handleAdd} className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Tambah {meta.singular} baru
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{meta.hint}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]">
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toLowerCase())}
            placeholder="kode-unik"
            spellCheck={false}
            className={`${inputCls} font-mono`}
            maxLength={40}
          />
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama Tampilan"
            className={inputCls}
            maxLength={100}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
          >
            {pending ? "Menyimpan…" : "+ Tambah"}
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>

      {/* Tabel daftar */}
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 font-semibold">Kode</th>
                <th className="px-5 py-3 font-semibold">Nama Tampilan</th>
                <th className="px-5 py-3 font-semibold">Dipakai</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.kode} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono text-xs text-[#A78BFA]">{row.kode}</td>
                  <td className="px-5 py-3 text-zinc-200">
                    {editing === row.kode ? (
                      <input
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className={`${inputCls} !py-1.5`}
                        maxLength={100}
                        autoFocus
                      />
                    ) : (
                      row.nama_tampilan
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                    {row.dipakai > 0 ? `${row.dipakai} template` : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {editing === row.kode ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveEdit(row)}
                            disabled={pending}
                            className="rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:bg-white/10"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="Btn"
                          >
                            Edit
                            <svg className="svg" viewBox="0 0 512 512" aria-hidden="true">
                              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            title={`Hapus ${row.nama_tampilan}`}
                            aria-label={`Hapus ${row.nama_tampilan}`}
                            className="btn-delete"
                          >
                            <svg viewBox="0 0 448 512" aria-hidden="true"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-zinc-500">
                    Belum ada {meta.singular}. Tambahkan lewat form di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
