import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { LogoManager } from "@/components/LogoManager";

export const dynamic = "force-dynamic";

export default async function LogoPage() {
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
    .from("logo_assets")
    .select("key,label,url,kind")
    .order("label");
  const rows = (data ?? []) as Array<{
    key: string;
    label: string;
    url: string;
    kind: string;
  }>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Kelola Logo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {rows.length} logo terdaftar. Menghapus baris aman: web otomatis fallback
          ke file bundled, lalu ikon generik.
        </p>
      </div>

      <LogoManager initial={rows} />
    </main>
  );
}
