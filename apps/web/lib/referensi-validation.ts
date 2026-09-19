/**
 * Validasi server-side untuk payload framework & kategori
 * (POST/PUT /api/frameworks dan /api/kategoris).
 * Bentuknya sama untuk kedua tabel: { kode, nama_tampilan }.
 */

const KODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_KODE = 40;
const MAX_NAMA = 100;

export interface NormalizedReferensiInput {
  kode: string;
  nama_tampilan: string;
}

export function validateReferensiInput(
  body: unknown,
  opts: { partial: boolean; entity: "Framework" | "Kategori" }
):
  | { ok: true; data: Partial<NormalizedReferensiInput> }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const b = body as Record<string, unknown>;
  const out: Partial<NormalizedReferensiInput> = {};
  const label = opts.entity.toLowerCase();

  // kode (immutable — diidentifikasi dari path pada PUT)
  if ("kode" in b || !opts.partial) {
    const kode = typeof b.kode === "string" ? b.kode.trim().toLowerCase() : "";
    if (!kode) return { ok: false, error: `Field 'kode' ${label} wajib diisi.` };
    if (kode.length > MAX_KODE || !KODE_RE.test(kode)) {
      return { ok: false, error: `Field 'kode' ${label} hanya boleh huruf kecil, angka, dan dash (contoh: company-profile).` };
    }
    out.kode = kode;
  }

  // nama_tampilan
  if ("nama_tampilan" in b || !opts.partial) {
    const nama = typeof b.nama_tampilan === "string" ? b.nama_tampilan.trim() : "";
    if (!nama) return { ok: false, error: `Field 'nama_tampilan' ${label} wajib diisi.` };
    if (nama.length > MAX_NAMA) return { ok: false, error: `Field 'nama_tampilan' ${label} maksimal 100 karakter.` };
    out.nama_tampilan = nama;
  }

  return { ok: true, data: out };
}
