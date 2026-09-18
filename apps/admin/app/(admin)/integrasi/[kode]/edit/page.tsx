import { notFound } from "next/navigation";
import type { Integrasi } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { IntegrasiForm, type IntegrasiFormInitial } from "@/components/IntegrasiForm";

export const dynamic = "force-dynamic";

export default async function EditIntegrasiPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  const { data: row } = await supabase
    .from("integrasi")
    .select("*")
    .eq("kode", kode.toLowerCase())
    .single();
  if (!row) notFound();
  const item = row as Integrasi;

  const initial: IntegrasiFormInitial = {
    kode: item.kode,
    nama_tampilan: item.nama_tampilan,
    kategori_integrasi: item.kategori_integrasi ?? "other",
    daftar_env_var: (item.daftar_env_var ?? []) as { key: string; deskripsi: string }[],
    instruksi_setup: item.instruksi_setup ?? "",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="animate-admin-enter text-2xl font-extrabold tracking-tight text-white">Edit Integrasi</h1>
      <p className="animate-admin-enter mb-6 mt-1 font-mono text-sm text-zinc-500" style={{ animationDelay: "60ms" }}>
        {item.kode}
      </p>
      <IntegrasiForm mode="edit" kode={item.kode} initial={initial} />
    </main>
  );
}
