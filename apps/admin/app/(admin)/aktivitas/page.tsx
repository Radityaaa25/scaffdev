import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { ActivityTimeline, type ActivityRow } from "@/components/ActivityTimeline";

export const dynamic = "force-dynamic";

export default async function AktivitasPage() {
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
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as ActivityRow[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Log Aktivitas</h1>
        <p className="mt-1 text-sm text-zinc-400">
          100 aktivitas terakhir — siapa melakukan apa di katalog.
        </p>
      </div>
      <ActivityTimeline initial={rows} />
    </main>
  );
}
