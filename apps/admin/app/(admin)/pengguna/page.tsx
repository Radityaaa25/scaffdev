import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { AdminUsersManager, type AdminRow } from "@/components/AdminUsersManager";

export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: session } = await supabase.auth.getUser();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const { data } = await supabase.rpc("admin_list");
  const rows = (Array.isArray(data) ? data : []) as AdminRow[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Kelola Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {rows.length} akun punya akses panel ini. Tidak ada registrasi publik.
        </p>
      </div>
      <div className="mt-6">
        <AdminUsersManager initial={rows} selfId={session.user?.id ?? ""} />
      </div>
    </main>
  );
}
