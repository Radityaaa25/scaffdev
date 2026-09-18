"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Template } from "@scaff/database";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

type StatusFilter = "all" | "published" | "draft";

export function TemplatesTable({ initial }: { initial: Template[] }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<Template[]>(initial);
  const [q, setQ] = useState("");
  const [fw, setFw] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Opsi framework mengikuti data yang ada — nilai baru dari form otomatis muncul.
  const frameworkOptions = useMemo(
    () => [...new Set(rows.map((r) => r.framework).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((t) => {
      if (fw !== "all" && t.framework !== fw) return false;
      if (status === "published" && !t.is_published) return false;
      if (status === "draft" && t.is_published) return false;
      if (needle && !`${t.nama} ${t.slug}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, fw, status]);

  async function handleTogglePublish(t: Template) {
    const next = !t.is_published;
    setToggling(t.slug);
    setRows((prev) => prev.map((r) => (r.slug === t.slug ? { ...r, is_published: next } : r)));
    const res = await apiFetch(
      `/api/templates/${encodeURIComponent(t.slug)}`,
      { method: "PUT", body: JSON.stringify({ is_published: next }) }
    );
    setToggling(null);
    if (!res.ok) {
      setRows((prev) => prev.map((r) => (r.slug === t.slug ? { ...r, is_published: t.is_published } : r)));
      toast.error(res.error || "Gagal mengubah status.");
      return;
    }
    toast.success(next ? `"${t.nama}" live — tampil di web & CLI.` : `"${t.nama}" jadi draft — disembunyikan dari publik.`);
    router.refresh();
  }

  async function handleDelete(t: Template) {
    const ok = await confirm({
      title: "Hapus template?",
      message: `"${t.nama}" akan dihapus permanen dari katalog. Template yang sudah di-generate user tidak terpengaruh.`,
      confirmLabel: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    setDeleting(t.slug);
    const res = await apiFetch<{ success: boolean }>(
      `/api/templates/${encodeURIComponent(t.slug)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      setDeleting(null);
      toast.error(res.error || "Gagal menghapus template.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.slug !== t.slug));
    setDeleting(null);
    toast.success(`Template "${t.nama}" dihapus.`);
    router.refresh();
  }

  const hasFilter = fw !== "all" || status !== "all" || q.trim() !== "";
  const selectCls =
    "glass-input cursor-pointer rounded-xl px-3 py-2 text-sm transition-all [&>option]:bg-[#131316]";

  return (
    <div className="animate-admin-enter">
      {/* Search + filter */}
      <div className="glass-panel mt-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau slug…"
          className="glass-input flex-1 rounded-xl px-4 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="filter-framework">Framework</label>
          <select
            id="filter-framework"
            value={fw}
            onChange={(e) => setFw(e.target.value)}
            className={selectCls}
          >
            <option value="all">Semua Framework</option>
            {frameworkOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={selectCls}
          >
            <option value="all">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {hasFilter && (
            <button
              type="button"
              onClick={() => { setQ(""); setFw("all"); setStatus("all"); }}
              className="animate-admin-popup rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {!hasFilter ? null : (
        <p className="mt-3 px-1 font-mono text-xs tabular-nums text-zinc-500">
          {filtered.length} dari {rows.length} template
        </p>
      )}

      <div className="glass-panel mt-4 overflow-hidden rounded-2xl">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-white/5 bg-[#101014]/95 text-xs uppercase tracking-wider text-zinc-500 backdrop-blur-xl">
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-5 py-3 font-medium">Framework</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Generate</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t, i) => {
                const isLaravel = t.framework === "laravel";
                return (
                <tr
                  key={t.id}
                  className={`animate-admin-enter group transition-all duration-300 hover:bg-white/[0.03] ${deleting === t.slug ? "pointer-events-none -translate-x-4 opacity-0" : ""}`}
                  style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="relative h-11 w-[72px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#8B5CF6]/25 to-[#131316]">
                        {t.screenshot_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.screenshot_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg font-extrabold text-white/40">
                            {(t.nama || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <p className="truncate font-medium text-zinc-100 transition-colors group-hover:text-white">{t.nama}</p>
                        <p className="truncate font-mono text-xs text-zinc-500">{t.slug}</p>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs ${
                      isLaravel ? "bg-[#FF2D20]/10 text-[#FF8A80]" : "bg-white/5 text-zinc-300"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isLaravel ? "bg-[#FF2D20]" : "bg-zinc-400"}`} />
                      {isLaravel ? "Laravel" : "Next.js"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_published ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <span className="relative flex h-1.5 w-1.5">
                        {t.is_published && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${t.is_published ? "bg-emerald-400" : "bg-amber-400"}`} />
                      </span>
                      {t.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-mono tabular-nums text-zinc-200">{t.downloads_count ?? 0}</span>
                    <span className="font-mono text-zinc-600">×</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={t.is_published}
                        title={t.is_published ? "Jadikan draft (sembunyikan)" : "Publish (tampilkan ke publik)"}
                        onClick={() => handleTogglePublish(t)}
                        disabled={toggling !== null || deleting !== null}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 active:scale-90 disabled:opacity-50 ${
                          t.is_published ? "bg-emerald-500 shadow-lg shadow-emerald-500/25" : "bg-white/10 hover:bg-white/15"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
                            t.is_published ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                      <Link
                        href={`/templates/${encodeURIComponent(t.slug)}/edit`}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        disabled={deleting !== null}
                        title={`Hapus ${t.nama}`}
                        aria-label={`Hapus ${t.nama}`}
                        className="btn-delete"
                      >
                        {deleting === t.slug ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <svg viewBox="0 0 448 512" aria-hidden="true"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <div className="animate-admin-popup mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl">
                      {rows.length === 0 ? "📦" : "🔍"}
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      {rows.length === 0 ? "Belum ada template." : "Tidak cocok dengan pencarian/filter."}
                    </p>
                    {rows.length === 0 ? (
                      <Link href="/templates/new" className="mt-4 inline-block rounded-xl bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95">
                        + Daftarkan yang pertama
                      </Link>
                    ) : (
                      <p className="mt-1 font-mono text-xs text-zinc-600">coba kata kunci atau reset filter</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
