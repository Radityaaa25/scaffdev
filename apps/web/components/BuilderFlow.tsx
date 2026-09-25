"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Template, TemplateDetailResponse } from "@scaff/database";
import { CommandBox } from "@/components/CommandBox";
import { IntegrationBadge } from "@/components/IntegrationBadge";

interface IntegrasiIndexItem {
  kode: string;
  nama_tampilan: string;
  kategori_integrasi?: string | null;
  repo_url?: string | null;
  framework_compat?: string[] | null;
  daftar_env_var?: { key: string; deskripsi: string }[];
}

const KATEGORI_LABEL: Record<string, string> = {
  payment: "Payment Gateway",
  database: "Database",
  auth: "Autentikasi",
  shipping: "Ongkos Kirim",
  other: "Lainnya",
};

const KATEGORI_ORDER = ["payment", "database", "auth", "shipping", "other"];
const SINGLE_SELECT = new Set(["payment", "database", "auth", "shipping"]);

const KATEGORI_DOT: Record<string, string> = {
  payment: "bg-blue-400",
  database: "bg-emerald-400",
  auth: "bg-[#8B5CF6]",
  shipping: "bg-amber-400",
  other: "bg-zinc-500",
};

function StepIndicator({ step, onSelect }: { step: number; onSelect?: (n: number) => void }) {
  const steps = [
    { n: 1, label: "Pilih base", short: "Base" },
    { n: 2, label: "Centang integrasi", short: "Racik" },
    { n: 3, label: "Command", short: "Command" },
  ];
  return (
    <ol className="flex items-stretch gap-1.5 sm:gap-2" aria-label="Langkah builder">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        const clickable = !!onSelect && s.n < step;
        return (
          <li key={s.n} className="flex flex-1 items-stretch gap-1.5 sm:gap-2 min-w-0">
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect(s.n)}
                aria-label={`Kembali ke langkah ${s.n}: ${s.label}`}
                className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.99] ${
                  active
                    ? "border-[#8B5CF6]/60 bg-gradient-to-r from-[#8B5CF6]/20 to-[#8B5CF6]/[0.04] shadow-lg shadow-[#8B5CF6]/15"
                    : done
                      ? "border-emerald-500/25 bg-emerald-500/[0.06] hover:border-emerald-500/50"
                      : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <StepDot n={s.n} active={active} done={done} />
                <span className="min-w-0">
                  <span className={`block font-mono text-[10px] font-bold tracking-widest ${active ? "text-[#A78BFA]" : done ? "text-emerald-400/80" : "text-zinc-600"}`}>
                    LANGKAH {s.n}
                  </span>
                  <span className={`block truncate text-sm font-semibold ${active ? "text-white" : done ? "text-zinc-300" : "text-zinc-500"}`}>
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </span>
              </button>
            ) : (
              <span
                aria-current={active ? "step" : undefined}
                className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3.5 py-3 transition-all ${
                  active
                    ? "border-[#8B5CF6]/60 bg-gradient-to-r from-[#8B5CF6]/20 to-[#8B5CF6]/[0.04] shadow-lg shadow-[#8B5CF6]/15"
                    : done
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <StepDot n={s.n} active={active} done={done} />
                <span className="min-w-0">
                  <span className={`block font-mono text-[10px] font-bold tracking-widest ${active ? "text-[#A78BFA]" : done ? "text-emerald-400/80" : "text-zinc-600"}`}>
                    LANGKAH {s.n}
                  </span>
                  <span className={`block truncate text-sm font-semibold ${active ? "text-white" : done ? "text-zinc-300" : "text-zinc-500"}`}>
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </span>
              </span>
            )}
            {i < steps.length - 1 && (
              <span className="hidden w-6 self-center sm:block" aria-hidden="true">
                <span className={`block h-0.5 rounded-full transition-colors ${s.n < step ? "bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]" : "bg-white/10"}`} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition-all ${
        active
          ? "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/40"
          : done
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-[#1A1A1E] text-zinc-600"
      }`}
    >
      {done ? "✓" : `0${n}`}
    </span>
  );
}

function SectionTitle({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#8B5CF6]">{no}</p>
      <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#FAFAFA] tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed max-w-2xl">{desc}</p>
    </div>
  );
}

/**
 * Panel ringkasan racikan — sticky desktop di samping grid langkah 2.
 * Mobile memakai sticky bottom bar (lihat bawah) sehingga panel ini hidden.
 */
function RacikanAside({
  baseName,
  withCodes,
  hasDouble,
  canProceed,
  onProceed,
  onSkip,
}: {
  baseName: string;
  withCodes: string[];
  hasDouble: boolean;
  canProceed: boolean;
  onProceed: () => void;
  onSkip: () => void;
}) {
  return (
    <aside aria-label="Ringkasan racikan" className="hidden lg:block">
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl">
      <div className="h-[3px] bg-gradient-to-r from-[#8B5CF6] via-[#8B5CF6]/40 to-[#EC4899]/60" aria-hidden="true" />
      <div className="space-y-4 p-5">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500">RACIKANMU</p>
          <p className="mt-1.5 truncate text-sm font-bold text-white" title={baseName}>
            {baseName || "—"}
          </p>
          <p className="text-[11px] text-zinc-500">template base</p>
        </div>
        <div className="h-px bg-white/[0.07]" aria-hidden="true" />
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500">TAMBAHAN</p>
          {withCodes.length === 0 ? (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Belum ada tambahan — centang minimal 1 integrasi.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5">
              {withCodes.map((kode) => (
                <li
                  key={kode}
                  className="flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2.5 py-1.5 font-mono text-xs text-[#C4B5FD]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" aria-hidden="true" />
                  <span className="truncate">+ {kode}</span>
                </li>
              ))}
            </ul>
          )}
          {hasDouble && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-400">
              Double se-kategori — perlu konfirmasi.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!canProceed}
          onClick={onProceed}
          title={!canProceed ? "Centang minimal 1 integrasi dulu" : undefined}
          className="w-full px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:brightness-110 shadow-lg shadow-[#8B5CF6]/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          Lanjut: command →
        </button>
        <button
          type="button"
          onClick={onSkip}
          title="Base ini tidak butuh integrasi — langsung ke command polosan"
          className="w-full px-5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          atau lewati, generate polosan →
        </button>
      </div>
      </div>
    </aside>
  );
}

/**
 * Builder flow: base → centang integrasi → command custom.
 * Berbadge Coming Soon sampai matriks uji Fase 3 hijau (keputusan terkunci).
 */
export function BuilderFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [index, setIndex] = useState<IntegrasiIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  // Deep-link ?base=slug dari halaman detail (lazy init, tanpa effect).
  const [baseSlug, setBaseSlug] = useState<string | null>(() => searchParams.get("base"));
  const [baseDetail, setBaseDetail] = useState<TemplateDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(() => searchParams.get("base") !== null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [confirmDouble, setConfirmDouble] = useState(false);
  const [folder, setFolder] = useState("project-saya");
  const [installMode, setInstallMode] = useState<"ask" | "install" | "no-install">("ask");

  // Muat katalog + indeks integrasi paralel sekali saat mount.
  useEffect(() => {
    async function load() {
      try {
        const [tRes, iRes] = await Promise.all([fetch("/api/templates"), fetch("/api/integrasi")]);
        if (tRes.ok) {
          const t = await tRes.json();
          setTemplates(t.templates ?? []);
        }
        if (iRes.ok) {
          const d = await iRes.json();
          setIndex(d.integrasi ?? []);
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Deep-link ?base=slug ditangani via lazy init di atas (tanpa effect).

  // Muat detail base saat base dipilih/diganti. State loading diset di
  // event handler pemilih (bukan di effect) agar patuh aturan lint.
  useEffect(() => {
    if (!baseSlug) return;
    const slug = baseSlug;
    let cancelled = false;
    fetch(`/api/templates/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("gagal");
        return res.json() as Promise<TemplateDetailResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setBaseDetail(data);
        setDetailLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setBaseDetail(null);
        setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseSlug]);

  const base = useMemo(() => {
    const t = templates.find((t) => t.slug === baseSlug) ?? null;
    // Base yang disembunyikan (termasuk via deep-link lama) dianggap tidak ada.
    return t && t.builder_hidden !== true ? t : null;
  }, [templates, baseSlug]);
  const baseFramework = (baseDetail?.framework ?? base?.framework ?? "").toLowerCase();

  const bakedByKategori = useMemo(() => {
    const map = new Map<string, { kode: string; nama: string }>();
    for (const item of baseDetail?.integrasi ?? []) {
      const kat = (item.kategori_integrasi || "other").toLowerCase();
      if (!map.has(kat)) {
        map.set(kat, { kode: item.kode, nama: item.nama_tampilan });
      }
    }
    return map;
  }, [baseDetail]);

  const groups = useMemo(() => {
    const map = new Map<string, IntegrasiIndexItem[]>();
    for (const item of index) {
      const kat = (item.kategori_integrasi || "other").toLowerCase();
      if (!map.has(kat)) map.set(kat, []);
      map.get(kat)!.push(item);
    }
    return KATEGORI_ORDER.filter((k) => map.has(k)).map((k) => ({
      kategori: k,
      label: KATEGORI_LABEL[k] ?? k,
      single: SINGLE_SELECT.has(k),
      options: map.get(k)!,
    }));
  }, [index]);

  // Kategori yang disembunyikan pembuat template (daftar hitam per template).
  const hiddenSet = useMemo(
    () => new Set((baseDetail?.builder_hidden_kategoris ?? []).map((k) => k.toLowerCase())),
    [baseDetail]
  );
  const visibleGroups = useMemo(
    () => groups.filter((g) => !hiddenSet.has(g.kategori)),
    [groups, hiddenSet]
  );
  const hiddenCount = groups.length - visibleGroups.length;

  const withCodes = useMemo(
    () => Object.values(picked).flat().filter((kode, i, arr) => arr.indexOf(kode) === i),
    [picked]
  );

  // Double se-kategori: ada bawaan + pilihan beda di grup yang sama.
  const hasDouble = useMemo(() => {
    for (const [kat, codes] of Object.entries(picked)) {
      const baked = bakedByKategori.get(kat);
      if (baked && codes.some((c) => c !== baked.kode)) return true;
    }
    return false;
  }, [picked, bakedByKategori]);

  function togglePick(kategori: string, kode: string, single: boolean) {    setPicked((prev) => {
      const current = prev[kategori] ?? [];
      if (single) {
        return { ...prev, [kategori]: current.includes(kode) ? [] : [kode] };
      }
      return {
        ...prev,
        [kategori]: current.includes(kode)
          ? current.filter((c) => c !== kode)
          : [...current, kode],
      };
    });
  }

  // Lewati: base seperti landing page / web berita yang memang tidak butuh
  // integrasi tambahan — langsung ke command polosan.
  function skipToCommand() {
    setPicked({});
    setConfirmDouble(false);
    setStep(3);
  }
  const cleanFolder = folder.trim().replace(/\s+/g, "-") || "project-saya";
  const withFlag = withCodes.length > 0 ? ` --with=${withCodes.join(",")}` : "";
  const installFlag =
    installMode === "install" ? " --install" : installMode === "no-install" ? " --no-install" : "";
  const command = baseSlug
    ? `npx scaffdev@latest ${cleanFolder} --template=${baseSlug}${withFlag}${installFlag}`
    : "";

  const canProceedFromStep2 = withCodes.length > 0 && (!hasDouble || confirmDouble);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-[#131316] border border-[#26262B] rounded-2xl h-56" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-16 bg-[#131316] border border-[#26262B] rounded-2xl">
        <p className="text-zinc-300 text-sm font-medium mb-2">Gagal memuat katalog builder.</p>
        <button
          onClick={() => window.location.reload()}
          type="button"
          className="px-4 py-2 text-xs font-medium rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-16 bg-[#131316] border border-[#26262B] rounded-2xl">
        <p className="text-zinc-300 text-sm font-medium mb-1">Katalog masih kosong.</p>
        <p className="text-zinc-500 text-xs mb-4">Tambahkan template via halaman admin dulu.</p>
        <Link
          href="/templates"
          className="inline-block px-4 py-2 text-xs font-medium rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  // Template yang disembunyikan admin tidak pernah jadi base Builder.
  // (Katalog, CLI, dan halaman lain tidak terpengaruh.)
  const filteredTemplates = templates
    .filter((t) => t.builder_hidden !== true)
    .filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.nama.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.kategori.toLowerCase().includes(q) ||
      t.framework.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative">
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

      <div className="container relative mx-auto px-4 py-10 sm:px-6 max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
          Builder — Rancang Sendiri
        </h1>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Coming Soon
        </span>
      </div>
      <p className="mb-6 text-sm text-zinc-400 leading-relaxed max-w-2xl">
        Pilih template base, centang integrasi (maks 1 per kategori inti), dan dapatkan
        command custom. Command membutuhkan CLI <span className="font-mono text-zinc-300">0.2.0</span> (segera hadir).
      </p>

      <StepIndicator step={step} onSelect={(n) => setStep(n)} />

      {/* LANGKAH 1 — base */}
      {step === 1 && (
        <section aria-label="Langkah 1: pilih template base" className="mt-8 hero-enter">
          <SectionTitle
            no="01"
            title="Pilih template base"
            desc="Fondasi racikanmu. Template polosan (tanpa bawaan) memberi ruang paling lega untuk dikombinasikan."
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari base… (mis. basic, ecommerce, laravel)"
            aria-label="Cari template base"
            className="mb-4 w-full bg-[#131316] border border-[#26262B] rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 transition-all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="radiogroup" aria-label="Template base">
            {filteredTemplates.map((t) => {
              const active = baseSlug === t.slug;
              const clean = (t.opsi_integrasi ?? []).length === 0;
              return (
                <button
                  key={t.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setBaseSlug(t.slug);
                    setBaseDetail(null);
                    setPicked({});
                    setConfirmDouble(false);
                    setDetailLoading(true);
                  }}
                  className={`group relative flex gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
                    active
                      ? "border-[#8B5CF6] bg-gradient-to-br from-[#8B5CF6]/15 to-[#8B5CF6]/[0.03] shadow-xl shadow-[#8B5CF6]/20 ring-1 ring-[#8B5CF6]/40"
                      : "border-[#26262B] bg-[#131316] hover:border-[#8B5CF6]/40 hover:bg-white/[0.02] hover:shadow-lg hover:shadow-black/30"
                  }`}
                >
                  <span className="relative shrink-0">
                    {t.screenshot_url ? (
                      <img src={t.screenshot_url} alt="" loading="lazy" className="h-20 w-32 rounded-xl object-cover border border-white/10 transition-transform duration-300 group-hover:scale-[1.02]" />
                    ) : (
                      <span className="flex h-20 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A1A1E] to-[#0A0A0B] border border-white/5 font-mono text-[10px] text-zinc-600">
                        no img
                      </span>
                    )}
                    {clean && (
                      <span className="absolute -top-2 -left-2 rounded-full bg-emerald-500 px-2 py-px text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30">
                        Polosan
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="block truncate text-[15px] font-bold text-[#FAFAFA]">{t.nama}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-white/5 border border-white/10 px-1.5 py-px font-mono text-[10px] text-zinc-300">
                        {t.framework}
                      </span>
                      <span className="rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/25 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-[#A78BFA]">
                        {t.kategori}
                      </span>
                    </span>
                    {t.deskripsi ? (
                      <span className="mt-1.5 block truncate text-xs text-zinc-500">{t.deskripsi}</span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-all ${
                      active
                        ? "border-[#8B5CF6] bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/40"
                        : "border-zinc-700 text-transparent group-hover:border-zinc-500"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
          {filteredTemplates.length === 0 && (
            <p className="mt-4 text-center text-sm text-zinc-500">Tidak ada base yang cocok.</p>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={!baseSlug}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Lanjut: centang integrasi →
            </button>
          </div>
        </section>
      )}

      {/* LANGKAH 2 — centang integrasi */}
      {step === 2 && (
        <section aria-label="Langkah 2: centang integrasi" className="mt-8 hero-enter">
          <SectionTitle
            no="02"
            title="Centang integrasi favoritmu"
            desc="Maks 1 per kategori inti. Yang berlabel terkunci adalah bawaan base — tidak bisa diubah, hanya bisa ditambah."
          />
          {base && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.07] p-3.5 text-left transition-all hover:border-[#8B5CF6]/60 active:scale-[0.995]"
              aria-label={`Ganti base, saat ini ${base.nama}`}
            >
              {base.screenshot_url ? (
                <img src={base.screenshot_url} alt="" loading="lazy" className="h-11 w-[4.5rem] shrink-0 rounded-lg object-cover border border-white/10" />
              ) : (
                <span className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 font-mono text-[10px] text-zinc-500">
                  no img
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Base terpilih</span>
                <span className="block truncate text-sm font-semibold text-white">{base.nama}</span>
              </span>
              <span className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-[#A78BFA] border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                Ganti
              </span>
            </button>
          )}
          {!base ? (
            <p className="text-sm text-zinc-500">Base tidak ditemukan. Kembali dan pilih ulang.</p>
          ) : detailLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 h-36" />
              ))}
            </div>
          ) : (
            <>
            {hiddenCount > 0 && (
              <p className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-xs text-zinc-500">
                {hiddenCount} kategori disembunyikan pembuat template ini
                (tidak relevan untuk base ini). Tidak butuh apa pun?{" "}
                <button
                  type="button"
                  onClick={skipToCommand}
                  className="font-medium text-[#A78BFA] hover:underline"
                >
                  Lewati, generate polosan →
                </button>
              </p>
            )}
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
              {visibleGroups.map((group) => {
                const baked = bakedByKategori.get(group.kategori);
                const chosen = picked[group.kategori] ?? [];
                return (
                  <fieldset
                    key={group.kategori}
                    className={`relative overflow-hidden rounded-2xl border p-4 pt-5 transition-colors ${
                      chosen.length > 0
                        ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.05] shadow-lg shadow-[#8B5CF6]/[0.07]"
                        : "border-white/10 bg-[#0A0A0B]/60"
                    }`}
                  >
                    {chosen.length > 0 && (
                      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]" aria-hidden="true" />
                    )}
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${KATEGORI_DOT[group.kategori] ?? "bg-zinc-500"}`} aria-hidden="true" />
                      {group.label}{" "}
                      <span className="text-zinc-500 normal-case font-normal">
                        • {group.single ? "max 1" : "boleh multi"}
                      </span>
                      {chosen.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-[#8B5CF6] px-1.5 py-px text-[10px] font-bold text-white">
                          {chosen.length}
                        </span>
                      )}
                    </legend>
                    <div className="space-y-2 mt-1">
                      {baked && (
                        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-white/[0.03] border border-[#8B5CF6]/40">
                          <span aria-hidden="true" title="Terkunci — bawaan base">🔒</span>
                          <span className="text-zinc-200 font-medium">{baked.nama}</span>
                          <span className="ml-auto text-[10px] font-mono text-zinc-500">bawaan • terkunci</span>
                        </div>
                      )}
                      {group.options
                        .filter((opt) => opt.kode !== baked?.kode)
                        .map((opt) => {
                          const compat = opt.framework_compat ?? [];
                          const compatible =
                            compat.length === 0 || (baseFramework !== "" && compat.includes(baseFramework));
                          const checked = chosen.includes(opt.kode);
                          const hasModule = Boolean(opt.repo_url && opt.repo_url.trim() !== "");
                          const disabled = !compatible || !hasModule;
                          const reason = !hasModule
                            ? "modul belum tersedia"
                            : !compatible
                              ? `tidak mendukung ${baseFramework || "framework ini"}`
                              : null;
                          return (
                            <label
                              key={opt.kode}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm border transition-all ${
                                disabled
                                  ? "text-zinc-600 bg-white/[0.01] border-white/5 cursor-not-allowed"
                                  : checked
                                    ? "text-white bg-[#8B5CF6]/15 border-[#8B5CF6]/50 cursor-pointer"
                                    : "text-zinc-300 bg-white/[0.02] border-white/5 hover:border-white/20 cursor-pointer"
                              }`}
                            >
                              <input
                                type={group.single ? "radio" : "checkbox"}
                                name={`builder-${group.kategori}`}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => togglePick(group.kategori, opt.kode, group.single)}
                                className="accent-[#8B5CF6]"
                              />
                              <span className="font-mono text-[13px]">{opt.nama_tampilan}</span>
                              <span className="ml-auto text-[10px] font-mono text-zinc-600">
                                {reason ?? opt.kode}
                              </span>
                            </label>
                          );
                        })}
                      {group.options.filter((opt) => opt.kode !== baked?.kode).length === 0 && !baked && (
                        <p className="text-xs text-zinc-600 italic px-1">Belum ada opsi di kategori ini.</p>
                      )}
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <RacikanAside
              baseName={base?.nama ?? ""}
              withCodes={withCodes}
              hasDouble={hasDouble}
              canProceed={canProceedFromStep2}
              onProceed={() => setStep(3)}
              onSkip={skipToCommand}
            />
            </div>
            </>
          )}

          {hasDouble && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
              <input
                type="checkbox"
                checked={confirmDouble}
                onChange={(e) => setConfirmDouble(e.target.checked)}
                className="mt-0.5 accent-amber-500"
              />
              <span className="text-xs leading-relaxed text-zinc-300">
                <span className="font-semibold text-amber-300">Saya paham:</span> pilihan saya
                double dengan bawaan base se-kategori. CLI akan meminta konfirmasi lagi dan
                menyertakan panduan mencopot salah satunya di SETUP.md.
              </span>
            </label>
          )}

          <div className="sticky bottom-4 z-10 mt-6 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/40 via-white/10 to-[#EC4899]/30 p-[1px] shadow-2xl shadow-black/50 lg:hidden">
          <div className="rounded-2xl bg-[#0A0A0B]/95 p-3 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 px-1 text-xs text-zinc-400 leading-relaxed" aria-live="polite">
                {withCodes.length === 0 ? (
                  <>Belum ada tambahan — centang minimal <span className="text-zinc-200 font-semibold">1 integrasi</span> untuk lanjut.</>
                ) : (
                  <>Racikan: <span className="font-mono text-[#A78BFA]">{withCodes.join(" + ")}</span></>
                )}
                {hasDouble && (
                  <> <span className="text-amber-400 font-medium">• double, perlu konfirmasi di atas</span></>
                )}
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={skipToCommand}
                  title="Base ini tidak butuh integrasi — langsung ke command polosan"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 border border-dashed border-white/15 bg-transparent hover:border-white/30 hover:text-white transition-all active:scale-[0.98]"
                >
                  Lewati
                </button>
                <button
                  type="button"
                  disabled={!canProceedFromStep2}
                  onClick={() => setStep(3)}
                  title={!canProceedFromStep2 ? "Centang minimal 1 integrasi dulu" : undefined}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:brightness-110 shadow-lg shadow-[#8B5CF6]/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
                >
                  Lanjut: command →
                </button>
              </div>
            </div>
            </div>
          </div>
        </section>
      )}

      {/* LANGKAH 3 — command */}
      {step === 3 && base && (
        <section aria-label="Langkah 3: command custom" className="mt-8 space-y-4 hero-enter">
          <SectionTitle
            no="03"
            title="Command custom-mu jadi"
            desc="Salin, tempel di terminal, lalu execute. Membutuhkan CLI 0.2.0."
          />
          <div className="rounded-2xl border border-[#26262B] bg-[#131316] p-5">
            <p className="text-xs text-zinc-500 mb-1">Base</p>
            <p className="text-sm font-semibold text-[#FAFAFA]">{base.nama}</p>
            <p className="mt-3 text-xs text-zinc-500 mb-1.5">Tambahan (--with)</p>
            <div className="flex flex-wrap gap-1.5">
              {withCodes.map((kode) => (
                <IntegrationBadge key={kode} name={kode} />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="builder-folder" className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Nama folder
            </label>
            <input
              id="builder-folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="project-saya"
              spellCheck={false}
              maxLength={60}
              className="w-full sm:max-w-xs bg-[#131316] border border-[#26262B] rounded-xl px-3 py-2.5 text-sm font-mono text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none focus:border-[#8B5CF6]/60 transition-colors"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Install dependency
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["ask", "Tanya dulu", "Default — CLI bertanya [Y/n]"],
                  ["install", "--install", "Langsung jalan"],
                  ["no-install", "--no-install", "Lewati"],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    installMode === value
                      ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="builder-install"
                    checked={installMode === value}
                    onChange={() => setInstallMode(value)}
                    className="accent-[#8B5CF6]"
                  />
                  <span>
                    <span className="block font-mono text-[13px]">{label}</span>
                    <span className="block text-[11px] text-zinc-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="overflow-hidden rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/20 via-transparent to-[#EC4899]/10 p-[1px]">
            <div className="rounded-2xl bg-[#0A0A0B]/95 p-5 backdrop-blur-xl">
              <p className="text-sm font-semibold text-[#FAFAFA] mb-3">Jalankan di terminal:</p>
              <CommandBox command={command} />
              <p className="mt-3 text-[11px] text-zinc-500">
                Membutuhkan CLI <span className="font-mono text-zinc-300">0.2.0</span> (segera hadir).
                Prasyarat runtime mengikuti framework base
                {baseFramework ? <span className="font-mono text-zinc-300"> ({baseFramework})</span> : ""}.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl font-medium text-sm text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
            >
              ← Ubah racikan
            </button>
            <Link
              href="/templates"
              className="px-6 py-3 rounded-xl font-medium text-sm text-center text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
            >
              Atau pakai katalog (live)
            </Link>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
