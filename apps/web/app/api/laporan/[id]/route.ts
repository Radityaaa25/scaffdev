import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { validateLaporanStatus } from "@/lib/laporan-validation";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Ubah status laporan — khusus admin. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  const validated = validateLaporanStatus(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("laporan")
    .update({ status: validated.status })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ laporan: data });
}

/** Hapus laporan — khusus admin. */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const { error } = await supabase.from("laporan").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus laporan." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
