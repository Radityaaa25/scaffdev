/**
 * Validasi server-side untuk submission template komunitas.
 * Form publik /kontribusi → POST /api/submissions.
 *
 * Prinsip: jangan percaya input client. Semua teks dibersihkan dari karakter
 * kontrol, URL divalidasi ketat (HTTPS, tanpa kredensial, bukan host privat),
 * dan screenshot hanya boleh berasal dari storage Supabase milik Scaffdev.
 */

import { isIP } from "node:net";

const GITHUB_HOST = "github.com";
const SCREENSHOT_PATH_RE =
  /^\/storage\/v1\/object\/public\/template-screenshots\/laporan\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

const MAX_NAMA = 200;
const MAX_KATEGORI = 40;
const MAX_DESKRIPSI = 2000;
const MAX_AUTHOR = 120;
const MAX_EMAIL = 200;
const MAX_URL = 500;
const MAX_INTEGRASI = 20;

const ALLOWED_FRAMEWORKS = new Set(["nextjs", "laravel"]);
const RESERVED_KATEGORI = new Set(["other", "lainnya", "custom", "lain-lain"]);

const CONTROL_RE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF]/g;

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

export interface SubmissionValidationOptions {
  /** Origin Supabase (mis. https://xxx.supabase.co). Screenshot wajib dari sini. */
  allowedScreenshotOrigin?: string | null;
}

function cleanText(
  v: unknown,
  opts: { multiline?: boolean; max?: number } = {}
): string | null {
  if (typeof v !== "string") return null;
  let s = v.normalize("NFKC").replace(CONTROL_RE, "");
  if (opts.multiline) {
    s = s
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  s = s.trim();
  if (!s) return null;
  if (opts.max && s.length > opts.max) return s.slice(0, opts.max + 1);
  return s;
}

function isPublicIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function isPublicIpv6(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "::" || h === "::1") return false;
  if (h.startsWith("fc") || h.startsWith("fd")) return false; // unique local
  if (/^fe[89ab]/.test(h)) return false; // link-local
  if (h.startsWith("ff")) return false; // multicast
  if (h.startsWith("::ffff:")) {
    const v4 = h.slice(7);
    return isIP(v4) === 4 && isPublicIpv4(v4);
  }
  if (h.startsWith("::") && h.includes(".")) {
    const v4 = h.slice(2);
    return isIP(v4) === 4 && isPublicIpv4(v4);
  }
  return true;
}

function isPublicHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (!h || h.length > 253) return false;

  if (
    h === "localhost" ||
    h === "metadata" ||
    h === "metadata.google.internal" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".lan") ||
    h.endsWith(".home") ||
    h.endsWith(".test") ||
    h.endsWith(".invalid") ||
    h.endsWith(".example")
  ) {
    return false;
  }

  const ipVersion = isIP(h);
  if (ipVersion === 4) return isPublicIpv4(h);
  if (ipVersion === 6) return isPublicIpv6(h);

  // Domain publik harus punya titik. Ini juga menolak bentuk IP alternatif
  // seperti "0x7f000001", "2130706433", atau hostname intranet satu label.
  if (!h.includes(".")) return false;
  if (/^[0-9a-fx.]+$/i.test(h)) return false;
  return true;
}

function parseHttpsUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  if (!isPublicHostname(url.hostname)) return null;
  return url;
}

/** Normalisasi URL repo GitHub ke bentuk kanonik tanpa .git/query/fragment. */
export function normalizeGithubRepoUrl(raw: unknown): string | null {
  const s = cleanText(raw, { max: MAX_URL });
  if (!s || s.length > MAX_URL) return null;

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname.toLowerCase() !== GITHUB_HOST) return null;
  if (url.username || url.password || url.port || url.search || url.hash) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const owner = parts[0];
  let repo = parts[1];
  if (repo.toLowerCase().endsWith(".git")) repo = repo.slice(0, -4);
  if (!OWNER_RE.test(owner)) return null;
  if (!REPO_RE.test(repo) || repo === "." || repo === ".." || !/[A-Za-z0-9]/.test(repo)) {
    return null;
  }

  return `https://${GITHUB_HOST}/${owner}/${repo}`;
}

function optionalHttpsUrl(
  v: unknown,
  label: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = cleanText(v, { max: MAX_URL });
  if (!s) return { ok: true, value: null };
  if (s.length > MAX_URL) {
    return { ok: false, error: `Field '${label}' maksimal ${MAX_URL} karakter.` };
  }
  const url = parseHttpsUrl(s);
  if (!url) {
    return {
      ok: false,
      error: `Field '${label}' harus URL https publik yang valid (tanpa kredensial/host privat).`,
    };
  }
  return { ok: true, value: url.toString() };
}

function validateScreenshotUrl(
  v: unknown,
  allowedOrigin: string | null
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = cleanText(v, { max: MAX_URL });
  if (!s) return { ok: true, value: null };
  if (s.length > MAX_URL) {
    return { ok: false, error: "Field 'screenshot_url' terlalu panjang." };
  }
  if (!allowedOrigin) {
    return {
      ok: false,
      error: "Screenshot harus diunggah lewat form (storage belum dikonfigurasi).",
    };
  }

  const url = parseHttpsUrl(s);
  if (!url || url.origin !== allowedOrigin) {
    return {
      ok: false,
      error: "Screenshot harus diunggah lewat form kontribusi, bukan URL eksternal.",
    };
  }
  if (!SCREENSHOT_PATH_RE.test(url.pathname)) {
    return {
      ok: false,
      error: "Path screenshot tidak valid. Upload ulang lewat form kontribusi.",
    };
  }
  return { ok: true, value: url.toString() };
}

export function validateSubmissionInput(
  body: unknown,
  options: SubmissionValidationOptions = {}
): { ok: true; data: NormalizedSubmissionInput; honeypot: boolean } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
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

  const nama = cleanText(b.nama, { max: MAX_NAMA }) ?? "";
  if (nama.length < 3 || nama.length > MAX_NAMA) {
    return { ok: false, error: "Field 'nama' wajib diisi (3-200 karakter)." };
  }

  const framework = (cleanText(b.framework, { max: 40 }) ?? "").toLowerCase();
  if (!ALLOWED_FRAMEWORKS.has(framework)) {
    return { ok: false, error: "Framework harus 'nextjs' atau 'laravel'." };
  }

  const kategori = (cleanText(b.kategori, { max: MAX_KATEGORI }) ?? "").toLowerCase();
  if (!kategori || kategori.length > MAX_KATEGORI || !CODE_RE.test(kategori)) {
    return {
      ok: false,
      error: "Field 'kategori' hanya boleh huruf kecil, angka, dan dash (contoh: ecommerce).",
    };
  }
  if (RESERVED_KATEGORI.has(kategori)) {
    return { ok: false, error: "Pilih nama kategori yang lebih spesifik." };
  }

  const repoUrl = normalizeGithubRepoUrl(b.repo_url);
  if (!repoUrl) {
    return {
      ok: false,
      error: "Field 'repo_url' harus https://github.com/owner/repo (repo publik, tanpa query).",
    };
  }

  const preview = optionalHttpsUrl(b.preview_url, "preview_url");
  if (!preview.ok) return preview;

  const screenshot = validateScreenshotUrl(
    b.screenshot_url,
    options.allowedScreenshotOrigin ?? null
  );
  if (!screenshot.ok) return screenshot;

  const deskripsi = cleanText(b.deskripsi, { multiline: true, max: MAX_DESKRIPSI });
  if (deskripsi && deskripsi.length > MAX_DESKRIPSI) {
    return { ok: false, error: "Field 'deskripsi' maksimal 2000 karakter." };
  }

  const authorName = cleanText(b.author_name, { max: MAX_AUTHOR }) ?? "";
  if (authorName.length < 2 || authorName.length > MAX_AUTHOR) {
    return { ok: false, error: "Field 'author_name' wajib diisi (2-120 karakter)." };
  }

  const authorUrl = optionalHttpsUrl(b.author_url, "author_url");
  if (!authorUrl.ok) return authorUrl;

  const contactEmail = (cleanText(b.contact_email, { max: MAX_EMAIL }) ?? "").toLowerCase();
  if (contactEmail.length > MAX_EMAIL || !EMAIL_RE.test(contactEmail)) {
    return { ok: false, error: "Field 'contact_email' harus email yang valid." };
  }

  if (b.cla !== true || b.terms_accepted !== true) {
    return {
      ok: false,
      error: "Kamu wajib menyetujui Syarat & Ketentuan serta pernyataan kontribusi/CLA.",
    };
  }

  const rawIntegrasi = Array.isArray(b.opsi_integrasi)
    ? b.opsi_integrasi
    : typeof b.opsi_integrasi === "string"
      ? b.opsi_integrasi.split(",")
      : [];
  const opsiIntegrasi = [
    ...new Set(
      rawIntegrasi
        .filter((x): x is string => typeof x === "string")
        .map((x) => cleanText(x, { max: 40 })?.toLowerCase() ?? "")
        .filter(Boolean)
    ),
  ];
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
