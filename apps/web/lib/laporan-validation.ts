/**
 * Validasi server-side untuk laporan/pengaduan user.
 * POST publik: { kategori, judul, isi, kontak?, website? (honeypot) }.
 * PUT admin: { status }.
 */

export const LAPORAN_KATEGORI = ["bug", "saran", "lainnya"] as const;
export const LAPORAN_STATUS = ["baru", "diproses", "selesai"] as const;

const MAX_JUDUL = 200;
const MAX_ISI = 5000;
const MAX_KONTAK = 200;
const MAX_GAMBAR_URL = 500;
const HTTPS_URL_RE = /^https:\/\/[^\s/$.?#].[^\s]*$/i;

export interface NormalizedLaporanInput {
  kategori: string;
  judul: string;
  isi: string;
  kontak: string;
  gambar_url: string;
}

export function validateLaporanInput(
  body: unknown
): { ok: true; data: NormalizedLaporanInput; honeypot: boolean } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const b = body as Record<string, unknown>;

  // Honeypot anti-spam: field tak terlihat "website" — bila diisi bot, terima diam-diam tanpa simpan.
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return {
      ok: true,
      data: { kategori: "lainnya", judul: "", isi: "", kontak: "", gambar_url: "" },
      honeypot: true,
    };
  }

  const kategori = typeof b.kategori === "string" ? b.kategori.trim().toLowerCase() : "";
  if (!(LAPORAN_KATEGORI as readonly string[]).includes(kategori)) {
    return { ok: false, error: "Field 'kategori' harus salah satu: bug, saran, lainnya." };
  }
  const judul = typeof b.judul === "string" ? b.judul.trim() : "";
  if (!judul) return { ok: false, error: "Field 'judul' wajib diisi." };
  if (judul.length > MAX_JUDUL) return { ok: false, error: "Field 'judul' maksimal 200 karakter." };
  const isi = typeof b.isi === "string" ? b.isi.trim() : "";
  if (!isi) return { ok: false, error: "Field 'isi' wajib diisi." };
  if (isi.length > MAX_ISI) return { ok: false, error: "Field 'isi' maksimal 5000 karakter." };
  const kontak = typeof b.kontak === "string" ? b.kontak.trim() : "";
  if (kontak.length > MAX_KONTAK) return { ok: false, error: "Field 'kontak' maksimal 200 karakter." };
  // URL gambar bukti: hanya https (hasil upload /api/laporan/gambar).
  // Tidak divalidasi isi file di sini — file-nya sudah divalidasi magic bytes saat upload.
  const gambarUrl = typeof b.gambar_url === "string" ? b.gambar_url.trim() : "";
  if (gambarUrl && (gambarUrl.length > MAX_GAMBAR_URL || !HTTPS_URL_RE.test(gambarUrl))) {
    return { ok: false, error: "Field 'gambar_url' harus URL https yang valid (upload via form)." };
  }

  return { ok: true, data: { kategori, judul, isi, kontak, gambar_url: gambarUrl }, honeypot: false };
}

export function validateLaporanStatus(
  body: unknown
): { ok: true; status: string } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const status =
    typeof (body as Record<string, unknown>).status === "string"
      ? ((body as Record<string, unknown>).status as string).trim().toLowerCase()
      : "";
  if (!(LAPORAN_STATUS as readonly string[]).includes(status)) {
    return { ok: false, error: "Field 'status' harus salah satu: baru, diproses, selesai." };
  }
  return { ok: true, status };
}
