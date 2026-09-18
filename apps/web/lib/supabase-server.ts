import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Supabase client server-side (API Routes / Server Components).
 * Memakai anon key + session cookie user — RLS tetap ditegakkan database.
 * Service role key TIDAK PERNAH dipakai di kode aplikasi.
 */
export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum di-set.");
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Dipanggil dari Server Component (read-only context) — aman diabaikan
          // karena middleware me-refresh session cookie.
        }
      },
    },
  });
}

/**
 * Client server-side yang membawa JWT user eksplisit (untuk flow Bearer
 * dari apps/admin). Query RLS berjalan sebagai user tersebut.
 */
export function createSupabaseTokenClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum di-set.");
  }
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* token flow: tidak ada cookie yang ditulis */
      },
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export interface AdminContext {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  email?: string;
}

/**
 * Guard untuk endpoint admin: wajib ada session user + terdaftar di admin_users.
 * Mendukung dua cara bawa session:
 *  1. Cookie (same-origin), 2. Header `Authorization: Bearer <access_token>`
 *     (dipakai apps/admin yang beda origin/port).
 * Mengembalikan NextResponse 401/403 saat gagal, atau context admin saat lolos.
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: NextResponse }
> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Konfigurasi Supabase belum lengkap." },
        { status: 500 }
      ),
    };
  }

  // Dukungan token Bearer dari apps/admin (cross-origin, tanpa cookie).
  // Seluruh operasi berikutnya (cek admin + write DB) berjalan sebagai user
  // pemilik token via token client — bukan anon.
  const authHeader = request?.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized. Token kosong." }, { status: 401 }),
      };
    }
    let tokenClient: ReturnType<typeof createSupabaseTokenClient>;
    try {
      tokenClient = createSupabaseTokenClient(token);
    } catch {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Konfigurasi Supabase belum lengkap." },
          { status: 500 }
        ),
      };
    }
    const { data, error } = await tokenClient.auth.getUser();
    if (error || !data.user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Unauthorized. Token tidak valid atau kedaluwarsa." },
          { status: 401 }
        ),
      };
    }
    return checkAdminMembership(tokenClient, data.user.id, data.user.email);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized. Silakan login sebagai admin." },
        { status: 401 }
      ),
    };
  }

  return checkAdminMembership(supabase, user.id, user.email);
}

async function checkAdminMembership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  email?: string
): Promise<{ ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }> {
  // Cek keanggotaan admin via SECURITY DEFINER is_admin() (tanpa expose admin_users).
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden. Akun ini bukan admin." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, ctx: { supabase, userId, email } };
}
