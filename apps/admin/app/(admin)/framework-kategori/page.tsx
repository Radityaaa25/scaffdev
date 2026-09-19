import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { ReferensiManager, type ReferensiRow } from "@/components/ReferensiManager";

export const dynamic = "force-dynamic";

export default async function FrameworkKategoriPage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const [{ data: fw, error: fwErr }, { data: kat, error: katErr }, { data: tpl }] = await Promise.all([
    supabase.from("frameworks").select("kode,nama_tampilan").order("nama_tampilan"),
    supabase.from("kategoris").select("kode,nama_tampilan").order("nama_tampilan"),
    supabase.from("templates").select("framework,kategori"),
  ]);

  const tablesMissing = Boolean(fwErr || katErr);

  const fwCount = new Map<string, number>();
  const katCount = new Map<string, number>();
  (tpl ?? []).forEach((t) => {
    if (t.framework) fwCount.set(t.framework, (fwCount.get(t.framework) ?? 0) + 1);
    if (t.kategori) katCount.set(t.kategori, (katCount.get(t.kategori) ?? 0) + 1);
  });

  const frameworks: ReferensiRow[] = (fw ?? []).map((r) => ({
    kode: r.kode as string,
    nama_tampilan: r.nama_tampilan as string,
    dipakai: fwCount.get(r.kode as string) ?? 0,
  }));
  const kategoris: ReferensiRow[] = (kat ?? []).map((r) => ({
    kode: r.kode as string,
    nama_tampilan: r.nama_tampilan as string,
    dipakai: katCount.get(r.kode as string) ?? 0,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Framework & Kategori</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Daftar resmi pilihan di form template. Nilai baru di sini otomatis jadi opsi form, filter katalog, dan pilihan CLI.
        </p>
      </div>

      {tablesMissing && (
        <div className="animate-admin-enter mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <p className="font-semibold">Tabel referensi belum ada di database.</p>
          <p className="mt-1 text-amber-200/80">
            Jalankan <span className="font-mono">Migrasi 006</span> di <span className="font-mono">packages/database/schema.sql</span> lewat
            Supabase SQL Editor, lalu muat ulang halaman ini. Selama tabel belum ada, form template memakai daftar cadangan.
          </p>
        </div>
      )}

      <ReferensiManager initialFrameworks={frameworks} initialKategoris={kategoris} />
    </main>
  );
}
