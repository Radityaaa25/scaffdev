"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { UploadIcon } from "@/components/DocsIcons";
import { KontribusiTermsDialog } from "@/components/KontribusiTermsDialog";

const inputCls =
  "w-full bg-[#24242C] border border-[#3F3F4C] rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 transition-all";

const FRAMEWORKS = [
  { value: "nextjs", label: "Next.js" },
  { value: "laravel", label: "Laravel" },
];

const CUSTOM_KATEGORI = "__other__";

const KATEGORIS = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "landing-page", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: CUSTOM_KATEGORI, label: "Lainnya (isi sendiri)" },
];

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const GITHUB_REPO_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}?(?:\.git)?\/?$/;

function slugifyKategori(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** Form pengajuan template komunitas (publik, tanpa login). */
export function KontribusiForm() {
  const [nama, setNama] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [kategori, setKategori] = useState("ecommerce");
  const [kategoriLain, setKategoriLain] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorUrl, setAuthorUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [integrasi, setIntegrasi] = useState("");
  const [cla, setCla] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleScreenshot(file: File) {
    setUploadError(null);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadError("File harus PNG, JPG, atau WebP.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setUploadError("Ukuran maksimal 1MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/laporan/gambar", { method: "POST", body: form });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !payload?.url) {
        setUploadError(payload?.error || `Upload gagal (HTTP ${res.status}).`);
        return;
      }
      setScreenshotUrl(payload.url);
    } catch {
      setUploadError("Tidak dapat mengupload gambar. Coba lagi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const kategoriFinal = kategori === CUSTOM_KATEGORI ? slugifyKategori(kategoriLain) : kategori;
    if (!nama.trim() || nama.trim().length < 3) return setError("Nama template wajib diisi (min. 3 karakter).");
    if (kategori === CUSTOM_KATEGORI && !kategoriFinal) {
      return setError("Isi nama kategori lain terlebih dahulu.");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kategoriFinal)) {
      return setError("Nama kategori hanya boleh berisi huruf, angka, dan dash.");
    }
    if (!GITHUB_REPO_RE.test(repoUrl.trim())) {
      return setError("Repo URL harus https://github.com/owner/repo (repo publik, tanpa query).");
    }
    if (!authorName.trim()) return setError("Nama author wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      return setError("Email kontak tidak valid.");
    }
    if (!cla) return setError("Centang persetujuan Syarat & Ketentuan dan kontribusi/CLA terlebih dahulu.");

    setPending(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          framework,
          kategori: kategoriFinal,
          repo_url: repoUrl.trim(),
          preview_url: previewUrl.trim(),
          screenshot_url: screenshotUrl,
          deskripsi: deskripsi.trim(),
          author_name: authorName.trim(),
          author_url: authorUrl.trim(),
          contact_email: contactEmail.trim().toLowerCase(),
          opsi_integrasi: integrasi.split(",").map((s) => s.trim()).filter(Boolean),
          cla: true,
          terms_accepted: true,
          website: "",
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(payload?.error || `Gagal mengirim (HTTP ${res.status}).`);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Submission masuk antrean!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          Tim akan mengaudit commit, mengecek struktur dan keamanan, lalu menghubungimu
          lewat email. Waktu review tergantung antrean dan kelengkapan materi.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          Kirim submission lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6 sm:p-8">
        <h2 className="text-base font-semibold text-[#FAFAFA]">Info Template</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sub-nama" className="mb-1.5 block text-sm font-medium text-zinc-300">Nama Template *</label>
            <input id="sub-nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="E-commerce Kopi Nusantara" maxLength={200} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sub-framework" className="mb-1.5 block text-sm font-medium text-zinc-300">Framework *</label>
            <select id="sub-framework" value={framework} onChange={(e) => setFramework(e.target.value)} className={`${inputCls} [&>option]:bg-[#24242C]`}>
              {FRAMEWORKS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sub-kategori" className="mb-1.5 block text-sm font-medium text-zinc-300">Kategori *</label>
            <select id="sub-kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${inputCls} [&>option]:bg-[#24242C]`}>
              {KATEGORIS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          {kategori === CUSTOM_KATEGORI && (
            <div className="sm:col-span-2">
              <label htmlFor="sub-kategori-lain" className="mb-1.5 block text-sm font-medium text-zinc-300">Nama Kategori Lain *</label>
              <input
                id="sub-kategori-lain"
                value={kategoriLain}
                onChange={(e) => setKategoriLain(e.target.value)}
                placeholder="contoh: kesehatan, keuangan, edukasi"
                maxLength={60}
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Disimpan sebagai slug:{" "}
                <span className="font-mono text-zinc-400">{slugifyKategori(kategoriLain) || "kategori-baru"}</span>
              </p>
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="sub-repo" className="mb-1.5 block text-sm font-medium text-zinc-300">Repo GitHub Publik *</label>
            <input id="sub-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/username/nama-repo" maxLength={500} className={`${inputCls} font-mono`} />
            <p className="mt-1.5 text-xs text-zinc-500">Wajib publik agar bisa diaudit dan di-clone tanpa token. Jangan sertakan query string.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sub-preview" className="mb-1.5 block text-sm font-medium text-zinc-300">URL Demo / Preview (opsional)</label>
            <input id="sub-preview" type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://demo-kamu.vercel.app" maxLength={500} className={`${inputCls} font-mono`} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sub-deskripsi" className="mb-1.5 block text-sm font-medium text-zinc-300">Deskripsi</label>
            <textarea id="sub-deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} placeholder="Ceritakan isi, target pengguna, dan keunggulan template…" maxLength={2000} className={`${inputCls} resize-y`} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sub-integrasi" className="mb-1.5 block text-sm font-medium text-zinc-300">Integrasi yang dipakai (opsional)</label>
            <input id="sub-integrasi" value={integrasi} onChange={(e) => setIntegrasi(e.target.value)} placeholder="supabase, midtrans, rajaongkir" maxLength={300} className={`${inputCls} font-mono`} />
            <p className="mt-1.5 text-xs text-zinc-500">Pisahkan dengan koma. Kosongkan jika template basic.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6 sm:p-8">
        <h2 className="text-base font-semibold text-[#FAFAFA]">Screenshot</h2>
        <p className="mt-1 text-xs text-zinc-500">Opsional, png/jpg/webp maks 1MB. Bisa menyusul lewat email.</p>
        {screenshotUrl ? (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10">
            <img src={screenshotUrl} alt="Pratinjau screenshot" className="aspect-video w-full object-cover" />
            <button type="button" onClick={() => setScreenshotUrl("")} className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur transition-all hover:bg-red-500/70 hover:text-white">
              Hapus
            </button>
          </div>
        ) : null}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading || pending} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleScreenshot(f); }} className="hidden" aria-label="Upload screenshot" />
        <button type="button" disabled={uploading || pending} onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-60">
          {uploading ? "Mengupload…" : (<><UploadIcon className="h-4 w-4" /> Pilih screenshot</>)}
        </button>
        {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
      </div>

      <div className="rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6 sm:p-8">
        <h2 className="text-base font-semibold text-[#FAFAFA]">Kontributor</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sub-author" className="mb-1.5 block text-sm font-medium text-zinc-300">Nama / Username *</label>
            <input id="sub-author" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Nama kamu atau @github" maxLength={120} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sub-author-url" className="mb-1.5 block text-sm font-medium text-zinc-300">URL Profil</label>
            <input id="sub-author-url" type="url" value={authorUrl} onChange={(e) => setAuthorUrl(e.target.value)} placeholder="https://github.com/username" maxLength={500} className={`${inputCls} font-mono`} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sub-email" className="mb-1.5 block text-sm font-medium text-zinc-300">Email Kontak *</label>
            <input id="sub-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="kamu@email.com" maxLength={200} className={inputCls} />
            <p className="mt-1.5 text-xs text-zinc-500">Hanya dipakai tim untuk koordinasi review. Tidak tampil publik.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.06] p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={cla} onChange={(e) => setCla(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#8B5CF6]" />
          <span className="text-sm leading-relaxed text-zinc-300">
            Saya pembuat atau pemegang hak template ini, tidak menyertakan secret/kode berbahaya,
            dan menyetujui{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTermsOpen(true);
              }}
              className="font-medium text-[#A78BFA] underline underline-offset-2 hover:text-[#C4B5FD]"
            >
              Syarat &amp; Ketentuan
            </button>{" "}
            serta <Link href="/docs/lisensi" className="text-[#A78BFA] hover:underline">CLA Scaffdev</Link>.
            Tim boleh mengaudit, menyalin ke organisasi scaffdev, dan menampilkan kredit nama saya.
          </span>
        </label>
      </div>

      <input type="text" name="website" value="" onChange={() => {}} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {error && <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-[0.99] disabled:opacity-60">
        {pending ? "Mengirim…" : "Kirim Submission"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Dengan mengirim, kamu menyetujui{" "}
        <button
          type="button"
          onClick={() => setTermsOpen(true)}
          className="text-[#A78BFA] underline underline-offset-2 hover:text-[#C4B5FD]"
        >
          Syarat &amp; Ketentuan
        </button>{" "}
        dan pernyataan kontribusi/CLA Scaffdev.
      </p>

      <KontribusiTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </form>
  );
}
