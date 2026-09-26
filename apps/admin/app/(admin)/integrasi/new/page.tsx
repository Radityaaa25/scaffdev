import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { IntegrasiForm } from "@/components/IntegrasiForm";

export const dynamic = "force-dynamic";

export default async function NewIntegrasiPage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const { data: frameworkRows } = await supabase
    .from("frameworks")
    .select("kode,nama_tampilan")
    .order("nama_tampilan");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="animate-admin-enter text-2xl font-extrabold tracking-tight text-white">Tambah Integrasi</h1>
      <p className="animate-admin-enter mb-6 mt-1 text-sm text-zinc-400" style={{ animationDelay: "60ms" }}>
        Contoh: payment gateway, database, atau layanan lain yang dipakai template.
      </p>
      <IntegrasiForm
        mode="new"
        frameworkOptions={(frameworkRows ?? []) as { kode: string; nama_tampilan: string }[]}
      />
    </main>
  );
}
