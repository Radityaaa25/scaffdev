import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { slugify } from "@/lib/template-validation";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Terima submission → buat draft template (belum publish).
 * Wajib sudah ada audit_commit dan severity bukan HIGH/CRITICAL.
 * Admin masih harus mirror repo ke org scaffdev + set repo_url sebelum publish.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email, userId } = auth.ctx;

  if (isRateLimited(`admin-write:${userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json({ error: "Terlalu banyak perubahan. Tunggu ±10 menit." }, { status: 429 });
  }

  const { data: sub, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Submission tidak ditemukan." }, { status: 404 });
  }
  if (sub.status === "rejected") {
    return NextResponse.json({ error: "Submission sudah ditolak." }, { status: 400 });
  }
  if (sub.template_slug) {
    return NextResponse.json({ ok: true, slug: sub.template_slug });
  }
  if (!sub.audit_commit) {
    return NextResponse.json({ error: "Isi commit audit (SHA) sebelum menerima submission." }, { status: 400 });
  }
  if (sub.audit_severity === "HIGH" || sub.audit_severity === "CRITICAL") {
    return NextResponse.json({ error: "Temuan HIGH/CRITICAL tidak boleh diterima tanpa perbaikan." }, { status: 400 });
  }

  const baseSlug = slugify(sub.nama, sub.framework);
  let slug = baseSlug;
  for (let i = 2; i <= 20; i++) {
    const { data: existing } = await supabase.from("templates").select("slug").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const auditedAt = new Date().toISOString();
  const { data: template, error: insertError } = await supabase
    .from("templates")
    .insert([{
      nama: sub.nama,
      slug,
      framework: sub.framework,
      kategori: sub.kategori,
      repo_url: sub.repo_url,
      deskripsi: sub.deskripsi,
      screenshot_url: sub.screenshot_url,
      preview_url: sub.preview_url,
      opsi_integrasi: sub.opsi_integrasi ?? [],
      is_published: false,
      is_community: true,
      author_name: sub.author_name,
      author_url: sub.author_url,
      source_url: sub.repo_url,
      audited_commit: sub.audit_commit,
      audited_at: auditedAt,
      builder_hidden_kategoris: [],
      builder_hidden: false,
    }])
    .select()
    .single();

  if (insertError || !template) {
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "Slug bentrok. Coba terima ulang." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal membuat draft template." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "accepted",
      template_slug: template.slug,
      reviewed_by: email ?? userId,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: `Draft dibuat, tapi status submission gagal diubah: ${updateError.message}` }, { status: 500 });
  }

  await logActivity(supabase, email, "submission.accept", "template", template.slug, template.nama);
  return NextResponse.json({ ok: true, slug: template.slug });
}
