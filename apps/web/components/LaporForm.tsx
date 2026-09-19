"use client";

import { useRef, useState } from "react";

const KATEGORI_OPTIONS = [
  { value: "bug", label: "Bug / Error", hint: "Fitur rusak, error, tampilan pecah" },
  { value: "saran", label: "Saran / Masukan", hint: "Ide perbaikan atau fitur baru" },
  { value: "lainnya", label: "Lainnya", hint: "Pengaduan lain seputar Scaffdev" },
];

const inputCls =
  "w-full bg-[#131316] border border-[#26262B] rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 transition-all";

/** Form laporan/pengaduan publik (tanpa login). */
export function LaporForm() {
  const [kategori, setKategori] = useState("bug");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [kontak, setKontak] = useState("");
  const [gambarUrl, setGambarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleGambarFile(file: File) {
    setUploadError(null);
    // Pra-cek cepat; validasi ASLI (magic bytes + 1MB, tolak SVG/GIF) di server.
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus gambar (png/jpg/webp).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 1MB.");
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
      setGambarUrl(payload.url);
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
    if (!judul.trim()) return setError("Judul wajib diisi.");
    if (!isi.trim()) return setError("Detail laporan wajib diisi.");
    setPending(true);
    try {
      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori,
          judul: judul.trim(),
          isi: isi.trim(),
          kontak: kontak.trim(),
          gambar_url: gambarUrl,
          website: "", // honeypot harus kosong (bot mengisinya)
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(payload?.error || `Gagal mengirim (HTTP ${res.status}).`);
        return;
      }
      setSuccess(true);
      setJudul("");
      setIsi("");
      setKontak("");
      setGambarUrl("");
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
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Laporan terkirim. Terima kasih!</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Tim kami akan menindaklanjuti. Bila kamu mencantumkan kontak, kami hubungi ke sana.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          Kirim laporan lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#26262B] bg-[#131316] p-6 sm:p-8 space-y-5">
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-300">Jenis laporan *</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {KATEGORI_OPTIONS.map((opt) => {
            const active = kategori === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKategori(opt.value)}
                aria-pressed={active}
                className={`rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                  active
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-lg shadow-[#8B5CF6]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <span className={`block text-sm font-semibold ${active ? "text-white" : "text-zinc-300"}`}>
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="lapor-judul" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Judul *
        </label>
        <input
          id="lapor-judul"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Contoh: Tombol generate tidak merespons di HP"
          maxLength={200}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="lapor-isi" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Detail *
        </label>
        <textarea
          id="lapor-isi"
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          placeholder="Ceritakan kronologinya: halaman apa, langkah apa, pesan error apa (tempel di sini)…"
          rows={6}
          maxLength={5000}
          className={`${inputCls} resize-y`}
        />
        <p className="mt-1.5 text-right font-mono text-[11px] text-zinc-600">{isi.length}/5000</p>
      </div>

      <div>
        <label htmlFor="lapor-kontak" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Kontak <span className="font-normal text-zinc-500">(opsional — email / no. HP / username)</span>
        </label>
        <input
          id="lapor-kontak"
          value={kontak}
          onChange={(e) => setKontak(e.target.value)}
          placeholder="Agar bisa kami hubungi untuk tindak lanjut"
          maxLength={200}
          className={inputCls}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-zinc-300">
          Gambar bukti <span className="font-normal text-zinc-500">(opsional — png/jpg/webp, maks 1MB)</span>
        </span>
        {gambarUrl ? (
          <div className="relative mb-3 overflow-hidden rounded-xl border border-white/10">
            <img src={gambarUrl} alt="Pratinjau gambar bukti" className="aspect-video w-full object-cover" />
            <button
              type="button"
              onClick={() => setGambarUrl("")}
              className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur transition-all hover:bg-red-500/70 hover:text-white"
            >
              Hapus
            </button>
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading || pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleGambarFile(file);
          }}
          className="hidden"
          aria-label="Upload gambar bukti"
        />
        <button
          type="button"
          disabled={uploading || pending}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-60"
        >
          {uploading ? "Mengupload…" : "⬆ Pilih gambar bukti"}
        </button>
        {uploadError && (
          <p className="mt-2 text-xs text-red-400">{uploadError}</p>
        )}
      </div>

      {/* Honeypot anti-spam: tak terlihat manusia, bot mengisinya */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        defaultValue=""
      />

      {error && (
        <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#8B5CF6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Mengirim…" : "Kirim Laporan"}
      </button>
      <p className="text-center text-xs text-zinc-600">Maksimal 5 laporan per jam per pengguna.</p>
    </form>
  );
}
