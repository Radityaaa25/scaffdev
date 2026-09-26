import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuilderFlow } from "@/components/BuilderFlow";
import { AskAI } from "@/components/AskAI";

export const metadata: Metadata = {
  title: "Builder — Rancang Sendiri Kombinasimu",
  description:
    "Builder Scaffdev: pilih template base dan centang integrasi favoritmu. Butuh CLI 0.2.0+.",
};

export default function BuilderPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.09] via-[#0A0A0B] to-[#0A0A0B] p-[1px]">
          <div className="flex items-start sm:items-center gap-3.5 rounded-2xl bg-[#0A0A0B]/90 px-4 sm:px-5 py-4 backdrop-blur-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-base mt-0.5 sm:mt-0" aria-hidden="true">
              ✦
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  New
                </span>
                <span className="text-zinc-400">
                  Builder sudah live — racik base + integrasi di bawah, lalu
                  jalankan command-nya dengan CLI <span className="font-mono text-zinc-200">0.2.0+</span>.
                </span>
              </p>
              <Link href="/docs/panduan-builder" className="mt-1 inline-block text-xs sm:text-sm font-medium text-[#8B5CF6] hover:underline">
                Cara pakai Builder →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-16 text-zinc-500 font-mono text-sm">
            Memuat builder…
          </div>
        }
      >
        <BuilderFlow />
      </Suspense>
      <AskAI />
    </main>
  );
}
