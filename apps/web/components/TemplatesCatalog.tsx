"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Template } from "@scaff/database";
import { TemplateCard } from "@/components/TemplateCard";
import { TemplatesHero } from "@/components/TemplatesHero";
import { fetchTemplates } from "@/lib/api";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Populer" },
  { value: "name", label: "Nama A–Z" },
];

const KATEGORI_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  "landing-page": "Landing Page",
  "portfolio": "Portfolio",
};

const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: "Next.js",
  laravel: "Laravel",
};

function prettyLabel(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const selectCls =
  "bg-[#131316] border border-[#26262B] rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#8B5CF6]/60 [&>option]:bg-[#131316] max-w-full";

/**
 * Katalog interaktif (client). Menerima data awal dari server agar konten
 * langsung ter-render untuk crawler & AI — lalu refresh di background.
 */
export function TemplatesCatalog({ initialTemplates }: { initialTemplates: Template[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allTemplates, setAllTemplates] = useState<Template[]>(initialTemplates);
  const [loading, setLoading] = useState(initialTemplates.length === 0);
  const [loadError, setLoadError] = useState(false);
  const [, startTransition] = useTransition();

  // Daftar resmi dari tabel referensi (dikelola admin). Fallback: nilai dari data template.
  const [refKategoris, setRefKategoris] = useState<{ kode: string; nama_tampilan: string }[]>([]);
  const [refFrameworks, setRefFrameworks] = useState<{ kode: string; nama_tampilan: string }[]>([]);
  const [refIntegrasi, setRefIntegrasi] = useState<{ kode: string; nama_tampilan: string }[]>([]);

  const selectedKategori = searchParams.get("kategori") || "all";
  const selectedFramework = searchParams.get("framework") || "all";
  const selectedIntegrasi = searchParams.get("integrasi") || "all";
  const searchQuery = searchParams.get("q") || "";
  const selectedSort = searchParams.get("sort") || "newest";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setLoadError(false);
      try {
        const [tpl, kat, fw, integ] = await Promise.all([
          fetchTemplates(),
          fetch("/api/kategoris").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/frameworks").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/integrasi").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setAllTemplates(tpl);
        if (kat?.kategoris) setRefKategoris(kat.kategoris);
        if (fw?.frameworks) setRefFrameworks(fw.frameworks);
        if (integ?.integrasi) setRefIntegrasi(integ.integrasi);
      } catch {
        // Data awal server tetap ditampilkan; hanya tandai error bila kosong total.
        setLoadError(allTemplates.length === 0);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opsi dropdown = union(tabel referensi, nilai di data template).
  // Jadi kategori yang baru ditambah admin langsung muncul walau belum dipakai template.
  const kategoriOptions = useMemo(() => {
    const found = new Set(allTemplates.map((t) => t.kategori).filter(Boolean));
    refKategoris.forEach((r) => found.add(r.kode));
    return ["all", ...Array.from(found).sort()];
  }, [allTemplates, refKategoris]);

  const kategoriLabels = useMemo(() => {
    const map: Record<string, string> = { ...KATEGORI_LABELS };
    refKategoris.forEach((r) => {
      map[r.kode] = r.nama_tampilan;
    });
    return map;
  }, [refKategoris]);

  const frameworkOptions = useMemo(() => {
    const found = new Set(allTemplates.map((t) => t.framework).filter(Boolean));
    refFrameworks.forEach((r) => found.add(r.kode));
    return ["all", ...Array.from(found).sort()];
  }, [allTemplates, refFrameworks]);

  const frameworkLabels = useMemo(() => {
    const map: Record<string, string> = { ...FRAMEWORK_LABELS };
    refFrameworks.forEach((r) => {
      map[r.kode] = r.nama_tampilan;
    });
    return map;
  }, [refFrameworks]);

  const integrasiOptions = useMemo(() => {
    const found = new Set<string>();
    allTemplates.forEach((t) => t.opsi_integrasi.forEach((i) => found.add(i.toLowerCase())));
    refIntegrasi.forEach((r) => found.add(r.kode.toLowerCase()));
    return ["all", "basic", ...Array.from(found).sort()];
  }, [allTemplates, refIntegrasi]);

  const updateParams = (patch: Record<string, string>, keepPage = false) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      const defaults: Record<string, string> = {
        kategori: "all",
        framework: "all",
        integrasi: "all",
        q: "",
        sort: "newest",
        page: "1",
      };
      if (!value || value === defaults[key]) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Ganti filter/search → kembali ke halaman 1.
    if (!keepPage) params.delete("page");
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = allTemplates.filter((item) => {
      const matchKategori = selectedKategori === "all" || item.kategori === selectedKategori;
      const matchFramework = selectedFramework === "all" || item.framework === selectedFramework;
      const matchIntegrasi =
        selectedIntegrasi === "all" ||
        (selectedIntegrasi === "basic"
          ? item.opsi_integrasi.length === 0
          : item.opsi_integrasi.some((i) => i.toLowerCase() === selectedIntegrasi));
      const matchQuery =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        (item.deskripsi ?? "").toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.framework.toLowerCase().includes(q) ||
        item.opsi_integrasi.some((i) => i.toLowerCase().includes(q));
      return matchKategori && matchFramework && matchIntegrasi && matchQuery;
    });

    const sorted = [...filtered];
    if (selectedSort === "popular") {
      sorted.sort((a, b) => (b.downloads_count ?? 0) - (a.downloads_count ?? 0));
    } else if (selectedSort === "name") {
      sorted.sort((a, b) => a.nama.localeCompare(b.nama));
    } else {
      sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return sorted;
  }, [allTemplates, selectedKategori, selectedFramework, selectedIntegrasi, searchQuery, selectedSort]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTemplates = filteredTemplates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilter =
    selectedKategori !== "all" ||
    selectedFramework !== "all" ||
    selectedIntegrasi !== "all" ||
    searchQuery.trim() !== "";

  const resetAll = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Nomor halaman compact: 1 … sekitar … terakhir
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, 2, safePage - 1, safePage, safePage + 1, totalPages - 1, totalPages]);
    return Array.from(set)
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, safePage]);

  return (
    <div className="relative">
      {/* Backdrop full halaman: grid + gradasi */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(90% 55% at 50% 0%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(90% 55% at 50% 0%, black 20%, transparent 80%)",
          }}
        />
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-[#8B5CF6]/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#EC4899]/[0.07] blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#8B5CF6]/10 blur-[120px]" />
      </div>

      <div className="container relative mx-auto px-4 py-12 max-w-7xl">
      <TemplatesHero />

      {/* Builder live banner */}
      <div className="flex items-start sm:items-center gap-3 bg-emerald-500/[0.07] border border-emerald-500/25 rounded-xl px-4 py-3 mb-6">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
          New
        </span>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          <span className="text-zinc-200 font-medium">Kombinasi integrasi custom sudah live</span> — pilih template
          polosan, centang payment / database / auth favoritmu di{" "}
          <Link href="/builder" className="text-[#8B5CF6] hover:underline font-medium">
            Builder →
          </Link>{" "}
          Maks 1 pilihan per kategori.
        </p>
      </div>

      {/* Search + Sort */}
      <div id="katalog" className="flex flex-col sm:flex-row gap-3 mb-4 scroll-mt-24">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="Cari nama, kategori, framework… (mis. toko, laravel, midtrans)"
            className="w-full bg-[#131316] border border-[#26262B] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 transition-all"
            aria-label="Cari template"
          />
          {searchQuery && (
            <button
              onClick={() => updateParams({ q: "" })}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-sm"
              aria-label="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="sort" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Urut:
          </label>
          <select
            id="sort"
            value={selectedSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className={selectCls}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Bar — dropdown hemat tempat, opsi mengikuti data admin */}
      <div className="bg-[#131316] border border-[#26262B] rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="filter-kategori" className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Kategori
            </label>
            <select
              id="filter-kategori"
              value={kategoriOptions.includes(selectedKategori) ? selectedKategori : "all"}
              onChange={(e) => updateParams({ kategori: e.target.value })}
              className={`${selectCls} w-full`}
            >
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k === "all" ? "Semua Kategori" : prettyLabel(k, kategoriLabels)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-framework" className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Framework
            </label>
            <select
              id="filter-framework"
              value={frameworkOptions.includes(selectedFramework) ? selectedFramework : "all"}
              onChange={(e) => updateParams({ framework: e.target.value })}
              className={`${selectCls} w-full`}
            >
              {frameworkOptions.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "Semua Framework" : prettyLabel(f, frameworkLabels)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-integrasi" className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Integrasi
            </label>
            <select
              id="filter-integrasi"
              value={integrasiOptions.includes(selectedIntegrasi) ? selectedIntegrasi : "all"}
              onChange={(e) => updateParams({ integrasi: e.target.value })}
              className={`${selectCls} w-full font-mono`}
            >
              {integrasiOptions.map((integ) => (
                <option key={integ} value={integ}>
                  {integ === "all" ? "Semua Integrasi" : integ === "basic" ? "Basic (tanpa integrasi)" : integ}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results meta */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-xs text-zinc-500 font-mono">
          {loading ? (
            "Memuat katalog…"
          ) : (
            <>
              Menampilkan <span className="text-zinc-200 font-bold">{pagedTemplates.length}</span> dari{" "}
              <span className="text-zinc-200 font-bold">{filteredTemplates.length}</span> template
              {totalPages > 1 && (
                <> • halaman <span className="text-zinc-200 font-bold">{safePage}/{totalPages}</span></>
              )}
            </>
          )}
        </p>
        {hasActiveFilter && !loading && (
          <button
            onClick={resetAll}
            type="button"
            className="text-xs font-medium text-[#8B5CF6] hover:underline shrink-0"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-[#131316] border border-[#26262B] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-zinc-800/60" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-zinc-800/80 rounded" />
                <div className="h-3 w-1/3 bg-zinc-800/60 rounded" />
                <div className="h-8 w-full bg-zinc-800/60 rounded" />
                <div className="h-10 w-full bg-zinc-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-[#131316] border border-[#26262B] rounded-2xl">
          <p className="text-zinc-300 text-sm font-medium mb-2">Gagal memuat katalog.</p>
          <p className="text-zinc-500 text-xs mb-4">Periksa koneksi internet lalu coba lagi.</p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedTemplates.map((template) => (
              <TemplateCard key={template.slug} template={template} />
            ))}
          </div>

          {/* Pagination — maks 12 per halaman */}
          {totalPages > 1 && (
            <nav aria-label="Navigasi halaman" className="flex items-center justify-center gap-1.5 mt-10">
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
                type="button"
                className="px-3 py-2 text-xs font-medium rounded-lg bg-[#26262B] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {pageNumbers.map((n, idx) => {
                const prev = pageNumbers[idx - 1];
                return (
                  <React.Fragment key={n}>
                    {prev !== undefined && n - prev > 1 && (
                      <span className="text-zinc-600 text-xs px-1">…</span>
                    )}
                    <button
                      onClick={() => goToPage(n)}
                      type="button"
                      aria-current={n === safePage ? "page" : undefined}
                      className={`min-w-9 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        n === safePage
                          ? "bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/30"
                          : "bg-[#26262B] text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  </React.Fragment>
                );
              })}
              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
                type="button"
                className="px-3 py-2 text-xs font-medium rounded-lg bg-[#26262B] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-[#131316] border border-[#26262B] rounded-2xl">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#26262B] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-zinc-500">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <p className="text-zinc-300 text-sm font-medium mb-1">
            {allTemplates.length === 0
              ? "Katalog masih kosong."
              : "Tidak ada template yang cocok dengan filter."}
          </p>
          <p className="text-zinc-500 text-xs mb-4">
            {allTemplates.length === 0
              ? "Template pertama sedang disiapkan — cek lagi nanti."
              : "Coba kata kunci lain atau reset filter."}
          </p>
          {hasActiveFilter && (
            <button
              onClick={resetAll}
              type="button"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
