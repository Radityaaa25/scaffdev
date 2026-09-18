import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client server-side (Server Components admin).
 * Session dibaca dari cookie apps/admin sendiri (port 3001).
 */
export async function createSupabaseAdminServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum di-set di apps/admin.");
  }
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
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
          /* Server Component read-only — middleware me-refresh session */
        }
      },
    },
  });
}
