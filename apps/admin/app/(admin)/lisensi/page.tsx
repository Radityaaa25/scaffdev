import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { LicenseManager, type LicenseRow } from "@/components/LicenseManager";

export const dynamic = "force-dynamic";

export default async function LisensiPage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const [{ data: licenses }, { data: templates }] = await Promise.all([
    supabase
      .from("licenses")
      .select("id,key,template_slug,email,status,note,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("templates").select("slug,nama").eq("is_premium", true).order("nama"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Lisensi Premium</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Terbitkan kunci untuk pembeli template premium (kunci = kredensial, tanpa login web).
          CLI memverifikasi kunci lalu mengunduh dari repo privat.
        </p>
      </div>
      <LicenseManager
        initial={(licenses ?? []) as LicenseRow[]}
        premiumTemplates={((templates ?? []) as { slug: string; nama: string }[]).map((t) => ({
          slug: t.slug,
          nama: t.nama,
        }))}
      />
    </main>
  );
}
