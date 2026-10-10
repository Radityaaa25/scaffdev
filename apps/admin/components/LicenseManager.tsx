"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export interface LicenseRow {
  id: string;
  key: string;
  template_slug: string;
  email: string;
  status: string;
  note: string;
  created_at: string;
}

export function LicenseManager({
  initial,
  premiumTemplates,
}: {
  initial: LicenseRow[];
  premiumTemplates: { slug: string; nama: string }[];
}) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<LicenseRow[]>(initial);
  const [slug, setSlug] = useState(premiumTemplates[0]?.slug ?? "");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fail(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slug) return fail("Pilih template premium dulu.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail("Email pembeli tidak valid.");
    setPending(true);
    const res = await apiFetch<{ license: LicenseRow }>("/api/licenses", {
      method: "POST",
      body: JSON.stringify({ template_slug: slug, email: email.trim(), note: note.trim() }),
    });
    setPending(false);
    if (!res.ok || !res.data) return fail(res.error || "Gagal menerbitkan lisensi.");
    const created = res.data.license;
    setRows((prev) => [created, ...prev]);
    setEmail("");
    setNote("");
    toast.success(`Kunci ${created.key} terbit. Kirim ke pembeli via chat/email.`);
    router.refresh();
  }

  async function handleToggle(row: LicenseRow) {
    const next = row.status === "active" ? "revoked" : "active";
    const ok = await confirm({
      title: next === "revoked" ? "Cabut kunci lisensi?" : "Pulihkan kunci lisensi?",
      message:
        next === "revoked"
          ? `Kunci ${row.key} tidak bisa dipakai generate lagi.`
          : `Kunci ${row.key} bisa dipakai generate lagi.`,
      danger: next === "revoked",
    });
    if (!ok) return;
    const res = await apiFetch<{ license: LicenseRow }>(`/api/licenses/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok || !res.data) {
      toast.error(res.error || "Gagal mengubah status.");
      return;
    }
    const updated = res.data.license;
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    toast.success(next === "revoked" ? "Kunci dicabut." : "Kunci dipulihkan.");
    router.refresh();
  }

  return (
    <div className="animate-admin-enter mt-6" style={{ animationDelay: "60ms" }}>
      <form onSubmit={handleCreate} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Terbitkan kunci baru</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">Template premium</span>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm"
            >
              {premiumTemplates.length === 0 && <option value="">(belum ada template premium)</option>}
              {premiumTemplates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nama} ({t.slug})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">Email pembeli</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pembeli@email.com"
              className="glass-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs text-zinc-500">Catatan (opsional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. pembayaran lunas 10 Okt, via transfer"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Menerbitkan..." : "Terbitkan kunci"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Kunci</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-zinc-200">{r.key}</td>
                <td className="px-4 py-3 text-zinc-300">{r.template_slug}</td>
                <td className="px-4 py-3 text-zinc-300">{r.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      r.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {r.status === "active" ? "aktif" : "dicabut"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(r)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                  >
                    {r.status === "active" ? "Cabut" : "Pulihkan"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500">
                  Belum ada lisensi. Terbitkan kunci pertama di atas setelah ada template premium.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
