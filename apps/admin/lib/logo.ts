import { apiFetch, getAccessToken, getApiBaseUrl } from "./api";

export type LogoKind = "integration" | "framework";

/**
 * URL relatif (/logo-*.svg) hanya ada di apps/web. Admin beda origin,
 * jadi preview harus di-resolve ke domain API web agar gambar tidak pecah.
 */
export function resolveLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return `${getApiBaseUrl()}${trimmed}`;
  return trimmed;
}

export interface LogoAssetInput {
  key: string;
  label: string;
  url: string;
  kind: LogoKind;
}

export async function saveLogoAsset(input: LogoAssetInput): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch("/api/logo-assets", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error || "Gagal menyimpan logo." };
}

export async function deleteLogoAsset(key: string): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch(`/api/logo-assets?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error || "Gagal menghapus logo." };
}

export async function uploadLogoFile(
  file: File
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: "NEXT_PUBLIC_API_BASE_URL belum di-set di apps/admin." };
  }
  const token = await getAccessToken();
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${base}/api/logo-assets/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !payload?.url) {
      return { ok: false, error: payload?.error || `Upload gagal (HTTP ${res.status}).` };
    }
    return { ok: true, url: payload.url };
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi API upload." };
  }
}
