import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAllIntegrasi } from "@/lib/data";
import { AskAI } from "@/components/AskAI";
import { PuzzleIcon, BookIcon } from "@/components/DocsIcons";
import { absoluteUrl, baseMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = baseMetadata({
  title: "Integrasi — Modul Siap Suntik",
  description:
    "Jelajahi modul integrasi Scaffdev: Supabase, Midtrans, Xendit, dan lainnya untuk Next.js & Laravel. Satu modul dipakai Builder dan CLI standalone.",
  alternates: { canonical: absoluteUrl("/integrasi") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/integrasi"),
    title: "Integrasi — Modul Siap Suntik",
    description:
      "Modul integrasi lokal Indonesia untuk Next.js & Laravel. Satu modul untuk Builder dan CLI.",
  },
});

const KATEGORI_LABEL: Record<string, string> = {
  payment: "Payment Gateway",
  database: "Database",
  auth: "Autentikasi",
  shipping: "Ongkos Kirim",
  other: "Lainnya",
};

function frameworkLabel(fw: string): string {
  const f = fw.toLowerCase();
  if (f === "nextjs") return "Next.js";
  if (f === "laravel") return "Laravel";
  return fw;
}

export default async function IntegrasiPage() {
  let items: Awaited<ReturnType<typeof getAllIntegrasi>> = [];
  try {
    items = await getAllIntegrasi();
  } catch {
    items = [];
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#8B5CF6]">
          ◆ Integrasi
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
          Modul Integrasi
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed">
          Satu modul dipakai bersama oleh{" "}
          <Link href="/builder" className="text-[#8B5CF6] hover:underline font-medium">
            Builder
          </Link>{" "}
          dan CLI standalone — tidak ada implementasi ganda. Pilih integrasi
          untuk melihat cara pasang dan dokumentasi resminya.
        </p>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-16 text-zinc-500 font-mono text-sm">
              Memuat katalog integrasi...
            </div>
          }
        >
          {items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500">
              Belum ada integrasi terdaftar.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((it) => {
                const fw = it.framework_compat ?? [];
                const viaBuilder = Boolean(it.repo_url && it.repo_url.trim() !== "");
                return (
                  <article
                    key={it.kode}
                    className="flex flex-col rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-5 transition-colors hover:border-[#8B5CF6]/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                        <PuzzleIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-[#FAFAFA]">
                          {it.nama_tampilan}
                        </h2>
                        <p className="text-[11px] font-mono text-zinc-500">
                          {KATEGORI_LABEL[it.kategori_integrasi ?? "other"] ?? it.kategori_integrasi} · {it.kode}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {fw.length === 0 ? (
                        <span className="rounded-md bg-white/5 border border-white/10 px-1.5 py-px font-mono text-[10px] text-zinc-300">
                          Semua framework
                        </span>
                      ) : (
                        fw.map((f) => (
                          <span
                            key={f}
                            className="rounded-md bg-white/5 border border-white/10 px-1.5 py-px font-mono text-[10px] text-zinc-300"
                          >
                            {frameworkLabel(f)}
                          </span>
                        ))
                      )}
                      <span
                        className={`rounded-md border px-1.5 py-px text-[10px] font-medium ${
                          viaBuilder
                            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                            : "bg-white/5 border-white/10 text-zinc-500"
                        }`}
                      >
                        {viaBuilder ? "Tersedia via Builder" : "Bundel template"}
                      </span>
                    </div>
                    <Link
                      href={`/integrasi/${it.kode}`}
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:border-[#8B5CF6]/40 hover:text-white active:scale-[0.98]"
                    >
                      <BookIcon className="mr-2 h-4 w-4" />
                      Lihat Integrasi
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </Suspense>
      </div>
      <AskAI />
    </main>
  );
}
