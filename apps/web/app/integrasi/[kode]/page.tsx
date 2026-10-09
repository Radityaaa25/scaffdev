import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIntegrasiByKode } from "@/lib/data";
import { AskAI } from "@/components/AskAI";
import { CommandBox } from "@/components/CommandBox";
import { IntegrationLogo } from "@/components/IntegrationLogo";
import { SetupSteps } from "@/components/SetupSteps";
import { absoluteUrl, baseMetadata } from "@/lib/seo";

export const revalidate = 3600;

interface IntegrasiDetailPageProps {
  params: Promise<{ kode: string }>;
}

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

export async function generateMetadata({ params }: IntegrasiDetailPageProps): Promise<Metadata> {
  const { kode } = await params;
  const item = await getIntegrasiByKode(kode);
  if (!item) {
    return baseMetadata({ title: "Integrasi tidak ditemukan" });
  }
  const title = `${item.nama_tampilan}: Integrasi Scaffdev`;
  const description =
    `Modul ${item.nama_tampilan} (${KATEGORI_LABEL[item.kategori_integrasi ?? "other"] ?? item.kategori_integrasi}) ` +
    `untuk Next.js & Laravel. Implementasi siap pakai berbasis dokumentasi resmi: satu modul untuk Builder dan CLI.`;
  return baseMetadata({
    title,
    description,
    alternates: { canonical: absoluteUrl(`/integrasi/${item.kode}`) },
    openGraph: {
      type: "website",
      url: absoluteUrl(`/integrasi/${item.kode}`),
      title,
      description,
    },
  });
}

export default async function IntegrasiDetailPage({ params }: IntegrasiDetailPageProps) {
  const { kode } = await params;
  const item = await getIntegrasiByKode(kode);

  if (!item) {
    notFound();
  }

  const fw = item.framework_compat ?? [];
  const viaBuilder = Boolean(item.repo_url && item.repo_url.trim() !== "");
  const docsUrl = (item.docs_url ?? "").trim();
  const envVars = item.daftar_env_var ?? [];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <Link
          href="/integrasi"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Semua integrasi
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA] overflow-hidden">
            <IntegrationLogo kode={item.kode} iconClassName="h-7 w-7" wordmarkClassName="h-6 w-auto" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
              {item.nama_tampilan}
            </h1>
            <p className="mt-1 text-xs font-mono text-zinc-500">
              {KATEGORI_LABEL[item.kategori_integrasi ?? "other"] ?? item.kategori_integrasi} · {item.kode}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {fw.length === 0 ? (
            <span className="rounded-md bg-white/5 border border-white/10 px-2 py-1 font-mono text-[11px] text-zinc-300">
              Semua framework
            </span>
          ) : (
            fw.map((f) => (
              <span
                key={f}
                className="rounded-md bg-white/5 border border-white/10 px-2 py-1 font-mono text-[11px] text-zinc-300"
              >
                {frameworkLabel(f)}
              </span>
            ))
          )}
          <span
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
              viaBuilder
                ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                : "bg-white/5 border-white/10 text-zinc-500"
            }`}
          >
            {viaBuilder ? "Tersedia via Builder" : "Bundel template"}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Instalasi
            </h2>
            <p className="text-xs text-zinc-500 mb-1.5">Segera (CLI 0.4.0+):</p>
            <CommandBox command={`npx scaffdev add ${item.kode}`} tooltipCopy />
            <p className="mt-4 text-xs text-zinc-500 mb-1.5">Hari ini via Builder:</p>
            <CommandBox command={`npx scaffdev@latest --template=<slug> --with=${item.kode}`} tooltipCopy />
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Ganti <span className="font-mono text-zinc-400">&lt;slug&gt;</span> dengan
              slug template base pilihanmu di{" "}
              <Link href="/templates" className="text-[#8B5CF6] hover:underline">
                katalog
              </Link>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Dokumentasi Resmi
            </h2>
            {docsUrl ? (
              <>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Implementasi Scaffdev mengikuti dokumentasi resmi di bawah.
                  Dokumentasi resmi tetap acuan utama.
                </p>
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-2 text-sm font-medium text-[#C4B5FD] transition-all hover:bg-[#8B5CF6]/20 active:scale-[0.98]"
                >
                  Baca Dokumentasi Resmi ↗
                </a>
                <p className="mt-2 truncate font-mono text-[11px] text-zinc-600" title={docsUrl}>
                  {docsUrl}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-500 leading-relaxed">
                Link dokumentasi resmi belum didaftarkan untuk integrasi ini.
              </p>
            )}
          </section>
        </div>

        {envVars.length > 0 && (
          <section className="mt-4 rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Environment Variables
            </h2>
            <ul className="space-y-2">
              {envVars.map((v) => (
                <li
                  key={v.key}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                >
                  <span className="font-mono text-xs text-[#A78BFA] shrink-0">{v.key}</span>
                  <span className="text-xs text-zinc-500">{v.deskripsi}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.instruksi_setup && (
          <section className="mt-4 rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-4">
              Cara Setup
            </h2>
            <SetupSteps text={item.instruksi_setup} />
          </section>
        )}
      </div>
      <AskAI />
    </main>
  );
}
