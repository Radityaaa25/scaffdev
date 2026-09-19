import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Builder Framework — Segera Hadir",
  description: "Langkah framework Builder Scaffdev segera hadir. Sementara itu pakai katalog template.",
};

export default async function BuilderFrameworkPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-8 text-center">
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Coming Soon
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#FAFAFA]">
          Builder — Rancang Sendiri Kombinasimu
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Preview racikan dan command custom masih disiapkan.
          Sementara itu, semua template bisa langsung dipakai dari katalog.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/templates"
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all active:scale-[0.98]"
          >
            Pakai Katalog (Live Sekarang)
          </Link>
          <Link
            href="/builder"
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
          >
            Tentang Builder
          </Link>
        </div>
      </div>
    </main>
  );
}
