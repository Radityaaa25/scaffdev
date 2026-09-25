/**
 * Validasi server-side untuk payload template (POST/PUT /api/templates).
 * Dipakai sebelum write ke database — jangan percaya input client apa adanya.
 */

/**
 * Framework & kategori WAJIB terdaftar di tabel frameworks/kategoris
 * (dikelola admin via menu "Framework & Kategori"). Tidak ada ketik bebas:
 * API menolak nilai di luar daftar agar katalog/CLI/filter selalu konsisten.
 */
export const FREE_VALUE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ALLOWED_FRAMEWORKS = ["nextjs", "laravel"] as const;
export const ALLOWED_KATEGORI = ["ecommerce", "landing-page", "portfolio"] as const;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Hanya repo GitHub publik https — mencegah URL arbitrer (file://, ssh, dsb)
// yang bisa disalahgunakan saat CLI melakukan git clone.
const REPO_URL_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/;
const HTTPS_URL_RE = /^https:\/\/[^\s/$.?#].[^\s]*$/i;

const MAX_NAMA = 200;
const MAX_DESKRIPSI = 2000;
const MAX_SCREENSHOT_URL = 500;

export interface NormalizedTemplateInput {
  nama: string;
  slug: string;
  framework: string;
  kategori: string;
  repo_url: string;
  deskripsi: string | null;
  screenshot_url: string | null;
  opsi_integrasi: string[];
  builder_hidden_kategoris: string[];
  builder_hidden: boolean;
  is_published: boolean;
}

export function slugify(nama: string, framework: string): string {
  return `${nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${framework}`
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

export function validateTemplateInput(
  body: unknown,
  opts: { partial: boolean; allowedIntegrasi: string[]; allowedFrameworks: string[] | null; allowedKategoris: string[] | null }
): { ok: true; data: Partial<NormalizedTemplateInput> } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const b = body as Record<string, unknown>;
  const out: Partial<NormalizedTemplateInput> = {};

  // nama
  if ("nama" in b || !opts.partial) {
    const nama = asString(b.nama);
    if (!nama) return { ok: false, error: "Field 'nama' wajib diisi." };
    if (nama.length > MAX_NAMA) return { ok: false, error: "Field 'nama' maksimal 200 karakter." };
    out.nama = nama;
  }

  // framework (wajib terdaftar bila tabel referensi tersedia;
  // bila tabel belum ada (migrasi 006 belum jalan), lolos sebagai legacy).
  if ("framework" in b || !opts.partial) {
    const framework = asString(b.framework)?.toLowerCase() ?? "";
    if (!framework || framework.length > 40 || !FREE_VALUE_RE.test(framework)) {
      return { ok: false, error: "Field 'framework' hanya boleh huruf kecil, angka, dan dash (contoh: nextjs, laravel)." };
    }
    if (opts.allowedFrameworks !== null && !opts.allowedFrameworks.includes(framework)) {
      return { ok: false, error: `Framework "${framework}" belum terdaftar. Tambahkan dulu via menu Framework & Kategori.` };
    }
    out.framework = framework;
  }

  // kategori (aturan sama seperti framework).
  if ("kategori" in b || !opts.partial) {
    const kategori = asString(b.kategori)?.toLowerCase() ?? "";
    if (!kategori || kategori.length > 40 || !FREE_VALUE_RE.test(kategori)) {
      return { ok: false, error: "Field 'kategori' hanya boleh huruf kecil, angka, dan dash (contoh: ecommerce)." };
    }
    if (opts.allowedKategoris !== null && !opts.allowedKategoris.includes(kategori)) {
      return { ok: false, error: `Kategori "${kategori}" belum terdaftar. Tambahkan dulu via menu Framework & Kategori.` };
    }
    out.kategori = kategori;
  }

  // slug (opsional — di-generate otomatis bila kosong)
  if ("slug" in b && b.slug !== "" && b.slug != null) {
    const slug = asString(b.slug)?.toLowerCase() ?? "";
    if (!SLUG_RE.test(slug)) {
      return { ok: false, error: "Field 'slug' hanya boleh huruf kecil, angka, dan dash (tanpa spasi)." };
    }
    out.slug = slug;
  } else if (!opts.partial && out.nama && out.framework) {
    out.slug = slugify(out.nama, out.framework);
  }

  // repo_url
  if ("repo_url" in b || !opts.partial) {
    const repoUrl = asString(b.repo_url) ?? "";
    if (!REPO_URL_RE.test(repoUrl)) {
      return { ok: false, error: "Field 'repo_url' harus URL GitHub https yang valid (contoh: https://github.com/username/repo.git)." };
    }
    out.repo_url = repoUrl;
  }

  // deskripsi
  if ("deskripsi" in b) {
    if (b.deskripsi != null && typeof b.deskripsi !== "string") {
      return { ok: false, error: "Field 'deskripsi' harus string." };
    }
    const d = asString(b.deskripsi);
    if (d && d.length > MAX_DESKRIPSI) return { ok: false, error: "Field 'deskripsi' maksimal 2000 karakter." };
    out.deskripsi = d && d.length > 0 ? d : null;
  } else if (!opts.partial) {
    out.deskripsi = null;
  }

  // screenshot_url
  if ("screenshot_url" in b) {
    if (b.screenshot_url != null && typeof b.screenshot_url !== "string") {
      return { ok: false, error: "Field 'screenshot_url' harus string URL." };
    }
    const s = asString(b.screenshot_url);
    if (s && (s.length > MAX_SCREENSHOT_URL || !HTTPS_URL_RE.test(s))) {
      return { ok: false, error: "Field 'screenshot_url' harus URL https yang valid." };
    }
    out.screenshot_url = s && s.length > 0 ? s : null;
  } else if (!opts.partial) {
    out.screenshot_url = null;
  }

  // opsi_integrasi
  if ("opsi_integrasi" in b) {
    if (!Array.isArray(b.opsi_integrasi)) {
      return { ok: false, error: "Field 'opsi_integrasi' harus array of string." };
    }
    const cleaned = [...new Set(
      b.opsi_integrasi
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )];
    const unknown = cleaned.filter((k) => !opts.allowedIntegrasi.includes(k));
    if (unknown.length > 0) {
      return { ok: false, error: `Kode integrasi tidak dikenal: ${unknown.join(", ")}.` };
    }
    out.opsi_integrasi = cleaned;
  } else if (!opts.partial) {
    out.opsi_integrasi = [];
  }

  // builder_hidden_kategoris (daftar hitam kategori untuk Builder;
  // hanya kode terdaftar yang diterima, tolak eksplisit bila asing)
  if ("builder_hidden_kategoris" in b) {
    if (!Array.isArray(b.builder_hidden_kategoris)) {
      return { ok: false, error: "Field 'builder_hidden_kategoris' harus array of string." };
    }
    const cleaned = [...new Set(
      b.builder_hidden_kategoris
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )];
    const allowed = opts.allowedKategoris;
    const unknown = allowed === null
      ? []
      : cleaned.filter((k) => !allowed.includes(k));
    if (unknown.length > 0) {
      return { ok: false, error: `Kategori tidak dikenal: ${unknown.join(", ")}.` };
    }
    out.builder_hidden_kategoris = cleaned;
  } else if (!opts.partial) {
    out.builder_hidden_kategoris = [];
  }

  // builder_hidden (sembunyikan template dari Builder; default tampil)
  if ("builder_hidden" in b) {
    if (typeof b.builder_hidden !== "boolean") {
      return { ok: false, error: "Field 'builder_hidden' harus boolean." };
    }
    out.builder_hidden = b.builder_hidden;
  } else if (!opts.partial) {
    out.builder_hidden = false;
  }

  // is_published
  if ("is_published" in b) {
    if (typeof b.is_published !== "boolean") {
      return { ok: false, error: "Field 'is_published' harus boolean." };
    }
    out.is_published = b.is_published;
  } else if (!opts.partial) {
    out.is_published = false;
  }

  return { ok: true, data: out };
}
