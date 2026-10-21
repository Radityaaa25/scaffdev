import type { Submission } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { SubmissionsTable } from "@/components/SubmissionsTable";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
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
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Submission[];
  const pending = rows.filter((r) => r.status === "pending" || r.status === "auditing").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Submission Komunitas</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {rows.length} submission masuk{pending > 0 ? `, ${pending} perlu ditinjau` : ""}. Buka
          submission untuk menjalankan audit otomatis, cek manual, lalu putuskan.
        </p>
      </div>
      <SubmissionsTable initial={rows} />
    </main>
  );
}
