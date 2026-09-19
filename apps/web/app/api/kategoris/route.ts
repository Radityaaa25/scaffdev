import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { validateReferensiInput } from "@/lib/referensi-validation";
import { logActivity } from "@/lib/activity";

export async function GET() {
  // Daftar kategori bersifat publik (filter katalog + dropdown CLI jujur).
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("kategoris")
      .select("*")
      .order("nama_tampilan");
    if (error) {
      return NextResponse.json({ error: "Gagal mengambil data kategori." }, { status: 500 });
    }
    return NextResponse.json({ kategoris: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

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

  const validated = validateReferensiInput(body, { partial: false, entity: "Kategori" });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kategoris")
    .insert([validated.data])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Kode "${validated.data.kode}" sudah dipakai kategori lain.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan kategori." }, { status: 500 });
  }

  await logActivity(supabase, email, "kategori.create", "referensi", data.kode, data.nama_tampilan);
  return NextResponse.json({ kategori: data }, { status: 201 });
}
