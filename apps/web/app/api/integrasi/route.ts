import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createSupabaseServerClient } from "@/lib/supabase-server";
import { validateIntegrasiInput } from "@/lib/integrasi-validation";
import { logActivity } from "@/lib/activity";

export async function GET() {
  // Katalog integrasi bersifat publik (dibaca CLI + form admin).
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("integrasi")
      .select("*")
      .order("nama_tampilan");
    if (error) {
      return NextResponse.json({ error: "Gagal mengambil data integrasi." }, { status: 500 });
    }
    return NextResponse.json({ integrasi: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  const validated = validateIntegrasiInput(body, { partial: false });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("integrasi")
    .insert([validated.data])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Kode "${validated.data.kode}" sudah dipakai integrasi lain.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan integrasi." }, { status: 500 });
  }

  await logActivity(supabase, email, "integrasi.create", "integrasi", data.kode, data.nama_tampilan);
  return NextResponse.json({ integrasi: data }, { status: 201 });
}
