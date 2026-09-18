import { createSupabaseBrowserClient } from "./supabase-client";

/**
 * Fungsi terpusat untuk pemanggilan API dari apps/admin ke apps/web.
 * Semua write (create/update/delete template) lewat HTTP ke apps/web/app/api/*,
 * BUKAN direct-write dari browser. Session admin dibawa via header Bearer
 * karena kedua app beda origin/port (cookie tidak ikut terkirim).
 */

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: "NEXT_PUBLIC_API_BASE_URL belum di-set di apps/admin." };
  }

  let accessToken: string | null = null;
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  } catch {
    /* tanpa session — server akan menjawab 401 */
  }

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    return { ok: false, error: `Tidak dapat menghubungi API di ${base}.` };
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* body kosong / bukan JSON */
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as Record<string, unknown>).error)
        : `Request gagal (HTTP ${res.status}).`;
    return { ok: false, error: message };
  }

  return { ok: true, data: payload as T };
}
