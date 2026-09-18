"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client sisi browser (Client Components admin).
 * Memakai anon key — RLS database tetap menjadi penegak akses.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum di-set di apps/admin.");
  }
  return createBrowserClient(url, anonKey);
}
