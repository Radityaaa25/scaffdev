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

  // Nilai framework & kategori yang sudah ada — jadi saran input (boleh ketik baru).
  const { data: existing } = await supabase.from("templates").select("framework,kategori");
  const frameworkOptions = [...new Set((existing ?? []).map((r) => r.framework as string).filter(Boolean))].sort();
  const kategoriOptions = [...new Set((existing ?? []).map((r) => r.kategori as string).filter(Boolean))].sort();

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
