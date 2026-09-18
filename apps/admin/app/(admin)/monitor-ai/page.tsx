import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { MonitorClient, type UsageRow } from "@/components/MonitorClient";

export const dynamic = "force-dynamic";

export default async function MonitorAIPage() {
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
    .from("ai_usage_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as UsageRow[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Monitor AI</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Token, latensi, dan error setiap request AI — terpisah per sumber (admin/user).
        </p>
      </div>
      <div className="mt-6">
        <MonitorClient initial={rows} />
      </div>
    </main>
  );
}
