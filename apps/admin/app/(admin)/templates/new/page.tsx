import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { TemplateForm } from "@/components/TemplateForm";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("integrasi")
    .select("kode, nama_tampilan")
    .order("nama_tampilan");
  const integrasiOptions = (data ?? []) as { kode: string; nama_tampilan: string }[];

  // Opsi resmi dari tabel referensi (dikelola di menu Framework & Kategori).
  // Fallback bila tabel belum ada (migrasi 006 belum jalan): nilai dari template + bawaan.
  const { data: frameworkRows, error: fwErr } = await supabase.from("frameworks").select("kode").order("kode");
  const { data: kategoriRows, error: katErr } = await supabase.from("kategoris").select("kode").order("kode");
  let frameworkOptions = (frameworkRows ?? []).map((r) => r.kode as string);
  let kategoriOptions = (kategoriRows ?? []).map((r) => r.kode as string);
  if (fwErr || katErr || frameworkOptions.length === 0 || kategoriOptions.length === 0) {
    const { data: existing } = await supabase.from("templates").select("framework,kategori");
    const fromTpl = (k: "framework" | "kategori") =>
      [...new Set((existing ?? []).map((r) => r[k] as string).filter(Boolean))].sort();
    if (frameworkOptions.length === 0) {
      frameworkOptions = [...new Set([...fromTpl("framework"), "nextjs", "laravel"])].sort();
    }
    if (kategoriOptions.length === 0) {
      kategoriOptions = [...new Set([...fromTpl("kategori"), "ecommerce", "landing-page", "portfolio"])].sort();
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="animate-admin-enter text-2xl font-extrabold tracking-tight text-white">Daftarkan Template Baru</h1>
      <p className="animate-admin-enter mb-6 mt-1 text-sm text-zinc-400" style={{ animationDelay: "60ms" }}>
        Tempel link repo GitHub publik milik teman — centang publish agar langsung live.
      </p>
      <TemplateForm mode="new" integrasiOptions={integrasiOptions} frameworkOptions={frameworkOptions} kategoriOptions={kategoriOptions} />
    </main>
  );
}
