/**
 * Validasi server-side untuk payload integrasi (POST/PUT /api/integrasi).
 */

export const ALLOWED_KATEGORI_INTEGRASI = [
  "database",
  "payment",
  "auth",
  "shipping",
  "other",
] as const;

const KODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ENV_KEY_RE = /^[A-Z][A-Z0-9_]{1,64}$/;

const MAX_KODE = 60;
const MAX_NAMA = 100;
const MAX_DESKRIPSI_ENV = 200;
const MAX_INSTRUKSI = 8000;
const MAX_ENV_VARS = 30;

export interface NormalizedEnvVar {
  key: string;
  deskripsi: string;
}

export interface NormalizedIntegrasiInput {
  kode: string;
  nama_tampilan: string;
  kategori_integrasi: string | null;
  daftar_env_var: NormalizedEnvVar[];
  instruksi_setup: string | null;
}

export function validateIntegrasiInput(
  body: unknown,
  opts: { partial: boolean }
):
  | { ok: true; data: Partial<NormalizedIntegrasiInput> }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const b = body as Record<string, unknown>;
  const out: Partial<NormalizedIntegrasiInput> = {};

  // kode (immutable — diidentifikasi dari path pada PUT)
  if ("kode" in b || !opts.partial) {
    const kode =
      typeof b.kode === "string" ? b.kode.trim().toLowerCase() : "";
    if (!kode) return { ok: false, error: "Field 'kode' wajib diisi." };
    if (kode.length > MAX_KODE || !KODE_RE.test(kode)) {
      return { ok: false, error: "Field 'kode' hanya boleh huruf kecil, angka, dan dash." };
    }
    out.kode = kode;
  }

  // nama_tampilan
  if ("nama_tampilan" in b || !opts.partial) {
    const nama = typeof b.nama_tampilan === "string" ? b.nama_tampilan.trim() : "";
    if (!nama) return { ok: false, error: "Field 'nama_tampilan' wajib diisi." };
    if (nama.length > MAX_NAMA) return { ok: false, error: "Field 'nama_tampilan' maksimal 100 karakter." };
    out.nama_tampilan = nama;
  }

  // kategori_integrasi
  if ("kategori_integrasi" in b) {
    if (b.kategori_integrasi != null && typeof b.kategori_integrasi !== "string") {
      return { ok: false, error: "Field 'kategori_integrasi' harus string." };
    }
    const k = typeof b.kategori_integrasi === "string" ? b.kategori_integrasi.trim().toLowerCase() : "";
    if (k && !(ALLOWED_KATEGORI_INTEGRASI as readonly string[]).includes(k)) {
      return { ok: false, error: `Field 'kategori_integrasi' harus salah satu: ${ALLOWED_KATEGORI_INTEGRASI.join(", ")}.` };
    }
    out.kategori_integrasi = k || null;
  } else if (!opts.partial) {
    out.kategori_integrasi = null;
  }

  // daftar_env_var
  if ("daftar_env_var" in b) {
    if (!Array.isArray(b.daftar_env_var)) {
      return { ok: false, error: "Field 'daftar_env_var' harus array." };
    }
    if (b.daftar_env_var.length > MAX_ENV_VARS) {
      return { ok: false, error: "Maksimal 30 environment variable per integrasi." };
    }
    const seen = new Set<string>();
    const cleaned: NormalizedEnvVar[] = [];
    for (const item of b.daftar_env_var) {
      if (typeof item !== "object" || item === null) {
        return { ok: false, error: "Setiap env var harus object {key, deskripsi}." };
      }
      const { key, deskripsi } = item as Record<string, unknown>;
      if (typeof key !== "string" || !ENV_KEY_RE.test(key.trim())) {
        return { ok: false, error: `Key env var tidak valid: "${String(key)}". Harus huruf kapital/angka/underscore (contoh: MIDTRANS_SERVER_KEY).` };
      }
      const k = key.trim();
      if (seen.has(k)) return { ok: false, error: `Key env var duplikat: "${k}".` };
      seen.add(k);
      const d = typeof deskripsi === "string" ? deskripsi.trim() : "";
      if (d.length > MAX_DESKRIPSI_ENV) {
        return { ok: false, error: `Deskripsi untuk "${k}" maksimal 200 karakter.` };
      }
      cleaned.push({ key: k, deskripsi: d });
    }
    out.daftar_env_var = cleaned;
  } else if (!opts.partial) {
    out.daftar_env_var = [];
  }

  // instruksi_setup
  if ("instruksi_setup" in b) {
    if (b.instruksi_setup != null && typeof b.instruksi_setup !== "string") {
      return { ok: false, error: "Field 'instruksi_setup' harus string markdown." };
    }
    const s = typeof b.instruksi_setup === "string" ? b.instruksi_setup.trim() : "";
    if (s.length > MAX_INSTRUKSI) {
      return { ok: false, error: "Field 'instruksi_setup' maksimal 8000 karakter." };
    }
    out.instruksi_setup = s || null;
  } else if (!opts.partial) {
    out.instruksi_setup = null;
  }

  return { ok: true, data: out };
}
