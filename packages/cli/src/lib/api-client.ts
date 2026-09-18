import { Template, TemplateDetailResponse } from "../types";

// URL basis API Scaffdev. Untuk development lokal, set:
//   SCAFF_API_BASE_URL=http://localhost:3000
// Default menunjuk ke deployment produksi apps/web.
const DEFAULT_API_URL =
  process.env.SCAFF_API_BASE_URL || "https://scaff.dev";

const REQUEST_TIMEOUT_MS = 8000;

function apiBaseUrl(): string {
  return DEFAULT_API_URL.replace(/\/+$/, "");
}

export async function fetchTemplatesFromApi(): Promise<Template[]> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/api/templates`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Tidak dapat menghubungi API Scaffdev di ${apiBaseUrl()}.\n` +
        `Pastikan apps/web sedang berjalan (atau set SCAFF_API_BASE_URL ke URL API yang benar).`
    );
  }

  if (!res.ok) {
    throw new Error(
      `API Scaffdev mengembalikan HTTP ${res.status}. Coba lagi nanti atau hubungi tim Scaffdev.`
    );
  }

  const data = (await res.json()) as { templates?: unknown };
  if (!Array.isArray(data.templates) || data.templates.length === 0) {
    throw new Error(
      "Belum ada template aktif yang terdaftar di API Scaffdev. " +
        "Tambahkan template lewat halaman admin terlebih dahulu."
    );
  }
  return data.templates as Template[];
}

export async function fetchTemplateDetailFromApi(
  slug: string
): Promise<TemplateDetailResponse> {
  const encodedSlug = encodeURIComponent(slug);
  let res: Response;
  try {
    // ?source=cli menandai request dari CLI agar tercatat sebagai statistik generate.
    res = await fetch(`${apiBaseUrl()}/api/templates/${encodedSlug}?source=cli`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Tidak dapat menghubungi API Scaffdev di ${apiBaseUrl()}.\n` +
        `Pastikan apps/web sedang berjalan (atau set SCAFF_API_BASE_URL ke URL API yang benar).`
    );
  }

  if (res.status === 404) {
    throw new Error(
      `Template dengan slug "${slug}" tidak ditemukan.\n` +
        `Jalankan tanpa flag --template untuk melihat daftar template yang tersedia.`
    );
  }

  if (!res.ok) {
    throw new Error(
      `API Scaffdev mengembalikan HTTP ${res.status}. Coba lagi nanti atau hubungi tim Scaffdev.`
    );
  }

  return (await res.json()) as TemplateDetailResponse;
}
