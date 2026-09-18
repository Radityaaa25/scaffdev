import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function guard() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, supabase };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, status: 403 as const, supabase };
  return { ok: true as const, supabase };
}

/** Muat seluruh pesan satu sesi (untuk ganti sesi di bubble). */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const g = await guard();
  if (!g.ok) {
    return NextResponse.json({ error: g.status === 401 ? "Unauthorized." : "Forbidden." }, { status: g.status });
  }

  const { data: session } = await g.supabase
    .from("ai_chat_sessions")
    .select("id,title")
    .eq("id", id)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  }

  const { data: messages } = await g.supabase
    .from("ai_chat_messages")
    .select("role,content,created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ session, messages: messages ?? [] });
}

/** Hapus sesi manual (cascade ke pesannya). */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const g = await guard();
  if (!g.ok) {
    return NextResponse.json({ error: g.status === 401 ? "Unauthorized." : "Forbidden." }, { status: g.status });
  }

  const { data: existing } = await g.supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("id", id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  }

  const { error } = await g.supabase.from("ai_chat_sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus sesi." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
