import Link from "next/link";
import type { Template } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { TemplatesTable } from "@/components/TemplatesTable";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
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
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });
  const templates = (data ?? []) as Template[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Kelola Template</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {templates.length} template terdaftar. Publish agar muncul di web & CLI.
          </p>
        </div>
        <Link
          href="/templates/new"
          className="rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/40 active:scale-95"
        >
          + Daftarkan Template
        </Link>
      </div>

      <TemplatesTable initial={templates} />
    </main>
  );
}
