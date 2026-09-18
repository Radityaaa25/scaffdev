import { NextResponse } from "next/server";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Daftar sesi chat (terbaru dulu). Sekalian lazy-purge:
 * sesi yang expires_at-nya lewat dihapus permanen di sini.
 */
export async function GET() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Purge malas: hapus sesi kedaluwarsa (>30 hari tanpa aktivitas).
  await supabase.from("ai_chat_sessions").delete().lt("expires_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .select("id,title,updated_at,expires_at")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: "Gagal mengambil daftar sesi." }, { status: 500 });
  }
  return NextResponse.json({ sessions: data ?? [] });
}
