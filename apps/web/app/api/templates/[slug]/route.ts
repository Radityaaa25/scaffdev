import { NextRequest, NextResponse } from "next/server";
import { getTemplateBySlug } from "@/lib/data";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase-server";
import { validateTemplateInput } from "@/lib/template-validation";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json(
      { error: "Template tidak ditemukan" },
      { status: 404 }
    );
  }

  // Statistik generate: hanya dihitung untuk request dari CLI (?source=cli),
  // bukan kunjungan halaman web. Kegagalan increment tidak menggagalkan response.
  const { searchParams } = new URL(request.url);
  if (searchParams.get("source") === "cli") {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.rpc("increment_template_downloads", { p_slug: slug });
    } catch {
      /* abaikan — statistik tidak boleh merusak response utama */
    }
  }

  return NextResponse.json(template);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  // Slug immutable — diidentifikasi dari path, tidak boleh diganti via body.
  const { data: existing } = await supabase
    .from("templates")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "slug" in body &&
    typeof (body as Record<string, unknown>).slug === "string" &&
    ((body as Record<string, unknown>).slug as string).trim() !== "" &&
    ((body as Record<string, unknown>).slug as string).trim().toLowerCase() !== slug.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Slug tidak dapat diubah. Buat template baru bila slug harus berbeda." },
      { status: 400 }
    );
  }

  const { data: integrasiRows } = await supabase.from("integrasi").select("kode");
  const allowedIntegrasi = (integrasiRows ?? []).map((r) => r.kode as string);

  const validated = validateTemplateInput(body, { partial: true, allowedIntegrasi });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { slug: _ignored, ...patch } = validated.data;
  void _ignored;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diubah." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("templates")
    .update(patch)
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui template." }, { status: 500 });
  }

  await logActivity(supabase, email, "template.update", "template", data.slug, data.nama);
  return NextResponse.json({ template: data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  const { data: existing } = await supabase
    .from("templates")
    .select("id,nama")
    .eq("slug", slug)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  const { error } = await supabase.from("templates").delete().eq("slug", slug);
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus template." }, { status: 500 });
  }

  await logActivity(supabase, email, "template.delete", "template", slug, existing.nama);
  return NextResponse.json({ success: true });
}
