import { supabase } from "./supabase";

/**
 * Peta key logo -> URL publik dari tabel logo_assets.
 * Dipakai server components agar tidak ada fetch client-side tambahan.
 * Gagal/DB kosong = {} dan pemanggil memakai fallback bundled.
 */
export async function getLogoMap(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.from("logo_assets").select("key,url");
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data as Array<{ key: string; url: string }>) {
      if (row.key && row.url) map[row.key.toLowerCase()] = row.url;
    }
    return map;
  } catch {
    return {};
  }
}
