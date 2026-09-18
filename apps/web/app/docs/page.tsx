import React from "react";
import { getAllDocs } from "@/lib/docs";
import { DocsSearch } from "@/components/DocsSearch";
import { CommandBox } from "@/components/CommandBox";

export const metadata = {
  title: "Dokumentasi Pengguna — Scaff",
  description: "Panduan lengkap penggunaan CLI, integrasi layanan, FAQ, dan kontribusi template Scaff.",
};

export default function DocsPage() {
  const docs = getAllDocs();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero Header */}
      <div className="relative mb-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#8B5CF6]/10 blur-[120px]"
        />
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#8B5CF6]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Documentation & Guides
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#FAFAFA] sm:text-5xl lg:text-6xl">
            Dokumentasi Scaffdev
          </h1>
          <p className="mb-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Pelajari cara menggunakan CLI, memahami integrasi layanan lokal (Midtrans, Xendit, Supabase), 
            serta standar membuat template baru untuk project Anda.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-[#8B5CF6]">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              {docs.length} panduan lengkap
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#8B5CF6]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Next.js + Laravel
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-[#8B5CF6]">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4m0-4h.01"/>
              </svg>
              Bahasa Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* Quick Start Command Box */}
      <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 via-transparent to-transparent p-[1px]">
        <div className="rounded-2xl bg-[#0A0A0B]/90 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-[#8B5CF6]">
                  <polyline points="4 17 10 11 4 5"/>
                  <line x1="12" x2="20" y1="19" y2="19"/>
                </svg>
                <h2 className="text-lg font-semibold text-[#FAFAFA]">
                  Mulai dalam 10 Detik
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                Jalankan command ini di terminal. Tidak perlu instalasi package sebelumnya.
              </p>
            </div>
            <CommandBox command="npx scaffdev@latest" className="md:min-w-[340px]" />
          </div>
        </div>
      </div>

      {/* Docs Grid Listing + Search */}
      <DocsSearch docs={docs} />
    </div>
  );
}