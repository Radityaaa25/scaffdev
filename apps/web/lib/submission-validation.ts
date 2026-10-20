/**
 * Validasi server-side untuk submission template komunitas.
 * Form publik /kontribusi → POST /api/submissions.
 */

const REPO_URL_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/;
const HTTPS_URL_RE = /^https:\/\/[^\s/$.?#].[^\s]*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_NAMA = 200;
const MAX_DESKRIPSI = 2000;
const MAX_AUTHOR = 120;
const MAX_EMAIL = 200;
const MAX_URL = 500;
const MAX_INTEGRASI = 20;

export interface NormalizedSubmissionInput {
  nama: string;
  framework: string;
  kategori: string;
  repo_url: string;
  preview_url: string | null;
  screenshot_url: string | null;
  deskripsi: string | null;
  author_name: string;
  author_url: string | null;
  contact_email: string;
  opsi_integrasi: string[];
  cla_accepted_at: string;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

function optionalHttps(v: unknown, label: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = asString(v);
  if (!s) return { ok: true, value: null };
  if (s.length > MAX_URL || !HTTPS_URL_RE.test(s)) {
    return { ok: false, error: `Field '${label}' harus URL https yang valid.` };
  }
  return { ok: true, value: s };
}

export function validateSubmissionInput(
  body: unknown
): { ok: true; data: NormalizedSubmissionInput; honeypot: boolean } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa JSON object." };
  }
  const b = body as Record<string, unknown>;

  // Honeypot: bot mengisi field tak terlihat "website". Terima diam-diam.
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return {
      ok: true,
      honeypot: true,
      data: {
        nama: "",
        framework: "",
        kategori: "",
        repo_url: "",
        preview_url: null,
        screenshot_url: null,
        deskripsi: null,
        author_name: "",
        author_url: null,
        contact_email: "",
        opsi_integrasi: [],
        cla_accepted_at: new Date().toISOString(),
      },
    };
  }

  const nama = asString(b.nama) ?? "";
  if (nama.length < 3 || nama.length > MAX_NAMA) {
    return { ok: false, error: "Field 'nama' wajib diisi (3-200 karakter)." };
  }

  const framework = (asString(b.framework) ?? "").toLowerCase();
  if (!framework || framework.length > 40 || !CODE_RE.test(framework)) {
    return { ok: false, error: "Field 'framework' tidak valid (contoh: nextjs, laravel)." };
  }

  const kategori = (asString(b.kategori) ?? "").toLowerCase();
  if (!kategori || kategori.length > 40 || !CODE_RE.test(kategori)) {
    return { ok: false, error: "Field 'kategori' tidak valid (contoh: ecommerce, landing-page)." };
  }

  const repoUrl = asString(b.repo_url) ?? "";
  if (!REPO_URL_RE.test(repoUrl)) {
    return { ok: false, error: "Field 'repo_url' harus URL GitHub https yang valid." };
  }

  const preview = optionalHttps(b.preview_url, "preview_url");
  if (!preview.ok) return preview;
  const screenshot = optionalHttps(b.screenshot_url, "screenshot_url");
  if (!screenshot.ok) return screenshot;

  const deskripsi = asString(b.deskripsi);
  if (deskripsi && deskripsi.length > MAX_DESKRIPSI) {
    return { ok: false, error: "Field 'deskripsi' maksimal 2000 karakter." };
  }

  const authorName = asString(b.author_name) ?? "";
  if (authorName.length < 2 || authorName.length > MAX_AUTHOR) {
    return { ok: false, error: "Field 'author_name' wajib diisi (2-120 karakter)." };
  }

  const authorUrl = optionalHttps(b.author_url, "author_url");
  if (!authorUrl.ok) return authorUrl;

  const contactEmail = asString(b.contact_email) ?? "";
  if (contactEmail.length > MAX_EMAIL || !EMAIL_RE.test(contactEmail)) {
    return { ok: false, error: "Field 'contact_email' harus email yang valid." };
  }

  if (b.cla !== true) {
    return { ok: false, error: "Kamu wajib menyetujui pernyataan kontribusi/CLA." };
  }

  const rawIntegrasi = Array.isArray(b.opsi_integrasi)
    ? b.opsi_integrasi
    : typeof b.opsi_integrasi === "string"
      ? b.opsi_integrasi.split(",")
      : [];
  const opsiIntegrasi = [...new Set(
    rawIntegrasi
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
  )];
  if (opsiIntegrasi.length > MAX_INTEGRASI) {
    return { ok: false, error: `Maksimal ${MAX_INTEGRASI} integrasi.` };
  }
  const invalid = opsiIntegrasi.find((k) => k.length > 40 || !CODE_RE.test(k));
  if (invalid) {
    return { ok: false, error: `Kode integrasi tidak valid: ${invalid}.` };
  }

  return {
    ok: true,
    honeypot: false,
    data: {
      nama,
      framework,
      kategori,
      repo_url: repoUrl,
      preview_url: preview.value,
      screenshot_url: screenshot.value,
      deskripsi: deskripsi && deskripsi.length > 0 ? deskripsi : null,
      author_name: authorName,
      author_url: authorUrl.value,
      contact_email: contactEmail,
      opsi_integrasi: opsiIntegrasi,
      cla_accepted_at: new Date().toISOString(),
    },
  };
}
