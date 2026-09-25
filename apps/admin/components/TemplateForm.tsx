"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl, getAccessToken } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export interface IntegrasiOption {
  kode: string;
  nama_tampilan: string;
}

export interface TemplateFormInitial {
  nama: string;
  slug: string;
  framework: string;
  kategori: string;
  repo_url: string;
  deskripsi: string;
  screenshot_url: string;
  opsi_integrasi: string[];
  builder_hidden_kategoris: string[];
  builder_hidden: boolean;
  is_published: boolean;
}

const REPO_URL_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const inputCls = "glass-input w-full rounded-xl px-4 py-2.5 text-sm transition-all";
const labelCls = "mb-1.5 block text-sm font-medium text-zinc-300";

function slugPreview(nama: string, framework: string): string {
  const base = nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) return "";
  return `${base}-${framework}`.replace(/^-+|-+$/g, "").slice(0, 120);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{title}</h2>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function TemplateForm({
  mode,
  slug,
  initial,
  integrasiOptions,
  frameworkOptions,
  kategoriOptions,
  kategoriList,
}: {
  mode: "new" | "edit";
  slug?: string;
  initial?: TemplateFormInitial;
  integrasiOptions: IntegrasiOption[];
  frameworkOptions: string[];
  kategoriOptions: string[];
  kategoriList: IntegrasiOption[];
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [slugInput, setSlugInput] = useState(initial?.slug ?? "");
  // Framework & kategori HANYA pilihan dari daftar resmi
  // (dikelola di menu Framework & Kategori). Tidak ada ketik bebas.
  const [framework, setFramework] = useState(initial?.framework ?? frameworkOptions[0] ?? "");
  const [kategori, setKategori] = useState(initial?.kategori ?? kategoriOptions[0] ?? "");
  // Pengaman data lama: nilai initial yang tidak ada di daftar tetap tampil
  // agar tidak hilang saat edit (API tetap menolak nilai tak terdaftar).
  const frameworkChoices = frameworkOptions.includes(framework) || !framework
    ? frameworkOptions
    : [...frameworkOptions, framework];
  const kategoriChoices = kategoriOptions.includes(kategori) || !kategori
    ? kategoriOptions
    : [...kategoriOptions, kategori];
  const [repoUrl, setRepoUrl] = useState(initial?.repo_url ?? "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi ?? "");
  const [screenshotUrl, setScreenshotUrl] = useState(initial?.screenshot_url ?? "");
  const [opsiIntegrasi, setOpsiIntegrasi] = useState<string[]>(initial?.opsi_integrasi ?? []);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [builderHidden, setBuilderHidden] = useState(initial?.builder_hidden ?? false);
  // Daftar HITAM kategori Builder: yang TIDAK dicentang = disembunyikan.
  const [hiddenKats, setHiddenKats] = useState<string[]>(initial?.builder_hidden_kategoris ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const autoSlug = useMemo(() => slugPreview(nama, framework), [nama, framework]);
  const repoValid = repoUrl.trim() === "" || REPO_URL_RE.test(repoUrl.trim());

  function toggleIntegrasi(kode: string) {
    setOpsiIntegrasi((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]
    );
  }

  function toggleHiddenKat(kode: string) {
    setHiddenKats((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]
    );
  }

  async function handleScreenshotFile(file: File) {
    setUploadError(null);
    // Pra-cek cepat di client; validasi ASLI (magic bytes + 2MB) di server
    // via POST /api/templates/screenshot agar tidak bisa dilewati.
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus gambar (png/jpg/webp).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran maksimal 2MB.");
      return;
    }
    const base = getApiBaseUrl();
    if (!base) {
      setUploadError("NEXT_PUBLIC_API_BASE_URL belum di-set di apps/admin.");
      return;
    }
    setUploading(true);
    try {
      const token = await getAccessToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${base}/api/templates/screenshot`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !payload?.url) {
        setUploadError(payload?.error || `Upload gagal (HTTP ${res.status}).`);
        return;
      }
      setScreenshotUrl(payload.url);
      toast.success("Screenshot terupload.");
    } catch {
      setUploadError("Tidak dapat menghubungi API. Coba lagi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const FW_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nama.trim()) {
      const msg = "Nama template wajib diisi.";
      setError(msg); toast.error(msg); return;
    }
    if (slugInput.trim() && !SLUG_RE.test(slugInput.trim().toLowerCase())) {
      const msg = "Slug hanya boleh huruf kecil, angka, dan dash.";
      setError(msg); toast.error(msg); return;
    }
    const fwClean = framework.trim().toLowerCase();
    const katClean = kategori.trim().toLowerCase();
    if (!fwClean || !FW_RE.test(fwClean)) {
      const msg = "Framework hanya boleh huruf kecil, angka, dan dash (contoh: nextjs, laravel, astro).";
      setError(msg); toast.error(msg); return;
    }
    if (!katClean || !FW_RE.test(katClean)) {
      const msg = "Kategori hanya boleh huruf kecil, angka, dan dash (contoh: ecommerce, company-profile).";
      setError(msg); toast.error(msg); return;
    }
    if (!REPO_URL_RE.test(repoUrl.trim())) {
      const msg = "Repo URL harus GitHub https yang valid dan public.";
      setError(msg); toast.error(msg); return;
    }
    if (screenshotUrl.trim() && !screenshotUrl.trim().startsWith("https://")) {
      const msg = "Screenshot URL harus diawali https://.";
      setError(msg); toast.error(msg); return;
    }

    setPending(true);
    const payload = {
      nama: nama.trim(),
      ...(slugInput.trim() ? { slug: slugInput.trim().toLowerCase() } : {}),
      framework: framework.trim().toLowerCase(),
      kategori: kategori.trim().toLowerCase(),
      repo_url: repoUrl.trim(),
      deskripsi: deskripsi.trim(),
      screenshot_url: screenshotUrl.trim(),
      opsi_integrasi: opsiIntegrasi,
      builder_hidden_kategoris: hiddenKats,
      builder_hidden: builderHidden,
      is_published: isPublished,
    };

    const res = await apiFetch<{ template: { slug: string } }>(
      mode === "new" ? "/api/templates" : `/api/templates/${encodeURIComponent(slug ?? "")}`,
      { method: mode === "new" ? "POST" : "PUT", body: JSON.stringify(payload) }
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error || "Gagal menyimpan template.");
      toast.error(res.error || "Gagal menyimpan template.");
      return;
    }
    toast.success(mode === "new" ? `Template "${nama.trim()}" tersimpan${isPublished ? " & live." : " sebagai draft."}` : "Perubahan tersimpan.");
    router.push("/templates");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-admin-enter space-y-4">
      <Section title="Identitas" hint="Nama tampil di katalog; slug dipakai di command CLI dan tidak bisa diubah setelah dibuat.">
        <div className="sm:col-span-2">
          <label htmlFor="nama" className={labelCls}>Nama Template *</label>
          <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="E-commerce Basic" className={inputCls} maxLength={200} />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>
            Slug {mode === "edit" ? "(immutable)" : "(opsional)"}
          </label>
          <input
            id="slug"
            value={mode === "edit" ? (slug ?? "") : slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            disabled={mode === "edit"}
            placeholder={autoSlug || "otomatis dari nama"}
            className={`${inputCls} font-mono ${mode === "edit" ? "opacity-60" : ""}`}
          />
          {mode === "new" && !slugInput.trim() && autoSlug && (
            <p className="mt-1.5 font-mono text-xs text-[#A78BFA]">→ {autoSlug}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="framework" className={labelCls}>Framework *</label>
            <select
              id="framework"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className={`${inputCls} font-mono [&>option]:bg-[#131316]`}
            >
              {frameworkChoices.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Hanya pilihan resmi. <Link href="/framework-kategori" className="text-[#A78BFA] hover:underline">Kelola di sini →</Link>
            </p>
          </div>
          <div>
            <label htmlFor="kategori" className={labelCls}>Kategori *</label>
            <select
              id="kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={`${inputCls} font-mono [&>option]:bg-[#131316]`}
            >
              {kategoriChoices.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Hanya pilihan resmi. <Link href="/framework-kategori" className="text-[#A78BFA] hover:underline">Kelola di sini →</Link>
            </p>
          </div>
        </div>
      </Section>

      <Section title="Repository" hint="Link repo GitHub publik milik pembuat template — CLI melakukan git clone tanpa token.">
        <div className="sm:col-span-2">
          <label htmlFor="repo_url" className={labelCls}>Link Repository *</label>
          <input
            id="repo_url"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/nama-repo.git"
            className={`${inputCls} font-mono ${repoUrl.trim() && !repoValid ? "border-red-500/50" : repoValid && repoUrl.trim() ? "border-emerald-500/40" : ""}`}
          />
          <p className={`mt-1.5 text-xs ${repoUrl.trim() && !repoValid ? "text-red-400" : "text-zinc-500"}`}>
            {repoUrl.trim() && !repoValid
              ? "Format belum valid — harus https://github.com/owner/repo(.git)"
              : repoUrl.trim()
                ? "✓ Format valid. Pastikan repo berstatus public."
                : "Wajib public agar bisa di-clone CLI tanpa token."}
          </p>
        </div>
        <div className="sm:col-span-2">
          <span className={labelCls}>Screenshot (opsional)</span>
          {screenshotUrl.trim().startsWith("https://") ? (
            <div className="relative mb-3 overflow-hidden rounded-xl border border-white/10">
              <img src={screenshotUrl} alt="Preview screenshot template" className="aspect-video w-full object-cover" />
              <button
                type="button"
                onClick={() => setScreenshotUrl("")}
                className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur transition-all hover:bg-red-500/70 hover:text-white"
              >
                Hapus
              </button>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleScreenshotFile(file);
              }}
              className="hidden"
              aria-label="Upload file gambar"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2.5 text-sm font-medium text-[#A78BFA] transition-all hover:bg-[#8B5CF6]/20 active:scale-95 disabled:opacity-60"
            >
              {uploading ? "Mengupload…" : "⬆ Upload file gambar (maks 2MB)"}
            </button>
          </div>
          {uploadError && (
            <p className="mt-2 text-xs text-red-400">{uploadError}</p>
          )}
          <label htmlFor="screenshot_url" className={`${labelCls} mt-3`}>…atau tempel URL https</label>
          <input id="screenshot_url" type="url" value={screenshotUrl} onChange={(e) => setScreenshotUrl(e.target.value)} placeholder="https://…/preview.png" className={`${inputCls} font-mono`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="deskripsi" className={labelCls}>Deskripsi</label>
          <textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} placeholder="Ceritakan isi & keunggulan template…" className={`${inputCls} resize-y`} maxLength={2000} />
        </div>
      </Section>

      <Section title="Integrasi & Publikasi" hint="Integrasi menentukan .env.example & SETUP.md yang di-generate CLI. Publish = langsung live di web + CLI.">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className={labelCls}>Integrasi yang disertakan</span>
            <Link href="/integrasi" className="shrink-0 text-xs font-medium text-[#A78BFA] hover:underline">
              Kelola integrasi →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {integrasiOptions.map((opt) => {
              const active = opsiIntegrasi.includes(opt.kode);
              return (
                <button
                  key={opt.kode}
                  type="button"
                  onClick={() => toggleIntegrasi(opt.kode)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                    active
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white shadow-lg shadow-[#8B5CF6]/20"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {active ? "✓ " : ""}{opt.nama_tampilan}
                </button>
              );
            })}
            {integrasiOptions.length === 0 && (
              <p className="text-xs text-zinc-500">Belum ada data integrasi di database.</p>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className={labelCls}>Tampil di Builder</span>
            <Link href="/framework-kategori" className="shrink-0 text-xs font-medium text-[#A78BFA] hover:underline">
              Kelola kategori →
            </Link>
          </div>
          <p className="mb-2 text-xs text-zinc-500">
            Centang = kategori tampil sebagai opsi di Builder. Kosongkan untuk menyembunyikan (mis. payment untuk landing page).
          </p>
          <div className="flex flex-wrap gap-2">
            {kategoriList.map((opt) => {
              const shown = !hiddenKats.includes(opt.kode);
              return (
                <button
                  key={opt.kode}
                  type="button"
                  onClick={() => toggleHiddenKat(opt.kode)}
                  aria-pressed={shown}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                    shown
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white shadow-lg shadow-[#8B5CF6]/20"
                      : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/25 hover:text-zinc-300"
                  }`}
                >
                  {shown ? "✓ " : ""}{opt.nama_tampilan}
                </button>
              );
            })}
            {kategoriList.length === 0 && (
              <p className="text-xs text-zinc-500">Belum ada data kategori — semua tampil secara default.</p>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#8B5CF6]" />
            <span>
              <span className="block text-sm font-medium text-zinc-200">Publish sekarang</span>
              <span className="block text-xs text-zinc-500">Template langsung muncul di katalog web & bisa di-clone via CLI.</span>
            </span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20">
            <input type="checkbox" checked={builderHidden} onChange={(e) => setBuilderHidden(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
            <span>
              <span className="block text-sm font-medium text-zinc-200">Sembunyikan dari Builder</span>
              <span className="block text-xs text-zinc-500">Template hilang total dari pilihan base Builder. Katalog, CLI, dan halaman lain tidak terpengaruh.</span>
            </span>
          </label>
        </div>
      </Section>

      {error && (
        <p className="animate-admin-popup rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Sticky submit bar */}
      <div className="sticky bottom-4 z-10">
        <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl p-3 pl-5">
          <p className="hidden font-mono text-xs text-zinc-500 sm:block">
            {mode === "new" ? (slugInput.trim() || autoSlug || "slug-otomatis") : slug} · {framework}
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menyimpan…
                </span>
              ) : mode === "new" ? "Simpan Template" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
