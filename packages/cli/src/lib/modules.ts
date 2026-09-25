import { apiBaseUrl } from "./api-client";

export interface IntegrasiRow {
  kode: string;
  nama_tampilan: string;
  kategori_integrasi?: string | null;
  daftar_env_var: { key: string; deskripsi: string }[];
  instruksi_setup?: string | null;
  repo_url?: string;
  framework_compat?: string[];
}

const REQUEST_TIMEOUT_MS = 8000;

/** Ambil katalog integrasi lengkap (termasuk repo_url) dari API. */
export async function fetchIntegrasiIndex(): Promise<IntegrasiRow[]> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/api/integrasi`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Tidak dapat menghubungi API Scaffdev di ${apiBaseUrl()}.\n` +
        `Pastikan apps/web sedang berjalan (atau set SCAFF_API_BASE_URL ke URL API yang benar).`
    );
  }
  if (!res.ok) {
    throw new Error(`API Scaffdev mengembalikan HTTP ${res.status}. Coba lagi nanti.`);
  }
  const data = (await res.json()) as { integrasi?: unknown };
  if (!Array.isArray(data.integrasi)) return [];
  return (data.integrasi as IntegrasiRow[]).filter(
    (r) => r && typeof r.kode === "string"
  );
}
