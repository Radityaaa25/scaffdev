import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates } from "@/lib/data";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { validateTemplateInput } from "@/lib/template-validation";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kategori = searchParams.get("kategori") ?? undefined;
  const framework = searchParams.get("framework") ?? undefined;

  // scope=all → butuh admin (untuk dashboard: termasuk draft + counter).
  if (searchParams.get("scope") === "all") {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { data, error } = await auth.ctx.supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: "Gagal mengambil data template." }, { status: 500 });
    }
    let rows = data ?? [];
    if (kategori && kategori !== "all") rows = rows.filter((r) => r.kategori === kategori);
    if (framework && framework !== "all") rows = rows.filter((r) => r.framework === framework);
    return NextResponse.json({ templates: rows });
  }

  const templates = await getAllTemplates({ kategori, framework });

  return NextResponse.json({
    templates,
  });
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

  const { data: integrasiRows } = await supabase.from("integrasi").select("kode");
  const allowedIntegrasi = (integrasiRows ?? []).map((r) => r.kode as string);
  // Tabel referensi mungkin belum ada (migrasi 006 belum jalan) → mode legacy (bebas).
  const { data: frameworkRows, error: fwErr } = await supabase.from("frameworks").select("kode");
  const allowedFrameworks = fwErr ? null : (frameworkRows ?? []).map((r) => r.kode as string);
  const { data: kategoriRows, error: katErr } = await supabase.from("kategoris").select("kode");
  const allowedKategoris = katErr ? null : (kategoriRows ?? []).map((r) => r.kode as string);

  const validated = validateTemplateInput(body, { partial: false, allowedIntegrasi, allowedFrameworks, allowedKategoris });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("templates")
    .insert([validated.data])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Slug "${validated.data.slug}" sudah dipakai template lain.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan template." }, { status: 500 });
  }

  await logActivity(supabase, email, "template.create", "template", data.slug, data.nama);
  return NextResponse.json({ template: data }, { status: 201 });
}
