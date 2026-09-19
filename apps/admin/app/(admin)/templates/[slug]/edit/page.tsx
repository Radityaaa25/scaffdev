import { notFound } from "next/navigation";
import type { Template } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { TemplateForm, type TemplateFormInitial } from "@/components/TemplateForm";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const { data: row } = await supabase
    .from("templates")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!row) notFound();
  const template = row as Template;

  const { data: integrasiRows } = await supabase
    .from("integrasi")
    .select("kode, nama_tampilan")
    .order("nama_tampilan");

  // Opsi resmi dari tabel referensi; fallback bila tabel belum ada (migrasi 006 belum jalan).
  const { data: frameworkRows, error: fwErr } = await supabase.from("frameworks").select("kode").order("kode");
  const { data: kategoriRows, error: katErr } = await supabase.from("kategoris").select("kode").order("kode");
  let frameworkOptions = (frameworkRows ?? []).map((r) => r.kode as string);
  let kategoriOptions = (kategoriRows ?? []).map((r) => r.kode as string);
  if (fwErr || katErr || frameworkOptions.length === 0 || kategoriOptions.length === 0) {
    const { data: existingRows } = await supabase.from("templates").select("framework,kategori");
    const fromTpl = (k: "framework" | "kategori") =>
      [...new Set((existingRows ?? []).map((r) => r[k] as string).filter(Boolean))].sort();
    if (frameworkOptions.length === 0) {
      frameworkOptions = [...new Set([...fromTpl("framework"), "nextjs", "laravel"])].sort();
    }
    if (kategoriOptions.length === 0) {
      kategoriOptions = [...new Set([...fromTpl("kategori"), "ecommerce", "landing-page", "portfolio"])].sort();
    }
  }

  const initial: TemplateFormInitial = {
    nama: template.nama,
    slug: template.slug,
    framework: template.framework,
    kategori: template.kategori,
    repo_url: template.repo_url,
    deskripsi: template.deskripsi ?? "",
    screenshot_url: template.screenshot_url ?? "",
    opsi_integrasi: template.opsi_integrasi ?? [],
    is_published: template.is_published,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="animate-admin-enter text-2xl font-extrabold tracking-tight text-white">Edit Template</h1>
      <p className="animate-admin-enter mb-6 mt-1 font-mono text-sm text-zinc-500" style={{ animationDelay: "60ms" }}>
        {template.slug}
      </p>
      <TemplateForm
        mode="edit"
        slug={template.slug}
        initial={initial}
        integrasiOptions={(integrasiRows ?? []) as { kode: string; nama_tampilan: string }[]}
        frameworkOptions={frameworkOptions}
        kategoriOptions={kategoriOptions}
      />
    </main>
  );
}
