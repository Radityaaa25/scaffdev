import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { validateReferensiInput } from "@/lib/referensi-validation";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ kode: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { kode } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("kategoris")
      .select("*")
      .eq("kode", kode.toLowerCase())
      .single();
    if (!data) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ kategori: data });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { kode } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const { data: existing } = await supabase
    .from("kategoris")
    .select("*")
    .eq("kode", kode.toLowerCase())
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  // Kode immutable.
  if (
    typeof body === "object" &&
    body !== null &&
    "kode" in body &&
    typeof (body as Record<string, unknown>).kode === "string" &&
    ((body as Record<string, unknown>).kode as string).trim() !== "" &&
    ((body as Record<string, unknown>).kode as string).trim().toLowerCase() !== kode.toLowerCase()
  ) {
    return NextResponse.json({ error: "Kode kategori tidak dapat diubah." }, { status: 400 });
  }

  const validated = validateReferensiInput(body, { partial: true, entity: "Kategori" });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { kode: _ignored, ...patch } = validated.data;
  void _ignored;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diubah." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kategoris")
    .update(patch)
    .eq("kode", kode.toLowerCase())
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui kategori." }, { status: 500 });
  }

  await logActivity(supabase, email, "kategori.update", "referensi", data.kode, data.nama_tampilan);
  return NextResponse.json({ kategori: data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { kode } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const { data: existing } = await supabase
    .from("kategoris")
    .select("kode,nama_tampilan")
    .eq("kode", kode.toLowerCase())
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  }

  // Tolak hapus bila masih dipakai template manapun (hindari referensi yatim).
  const { count } = await supabase
    .from("templates")
    .select("id", { count: "exact", head: true })
    .eq("kategori", kode.toLowerCase());
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Tidak bisa dihapus: masih dipakai ${count} template. Pindahkan dulu template terkait ke kategori lain.` },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("kategoris")
    .delete()
    .eq("kode", kode.toLowerCase());
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus kategori." }, { status: 500 });
  }

  await logActivity(supabase, email, "kategori.delete", "referensi", existing.kode, existing.nama_tampilan);
  return NextResponse.json({ success: true });
}
