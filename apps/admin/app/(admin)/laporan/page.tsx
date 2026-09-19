import type { Laporan } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { LaporanTable } from "@/components/LaporanTable";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
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
    .from("laporan")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Laporan[];
  const baru = rows.filter((r) => r.status === "baru").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Laporan Pengguna</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {rows.length} laporan masuk{baru > 0 ? ` — ${baru} belum dibaca` : ""}. Dari halaman publik /lapor.
        </p>
      </div>

      <LaporanTable initial={rows} />
    </main>
  );
}
