import React from "react";
import Link from "next/link";
import { getAllDocs } from "@/lib/docs";

export const metadata = {
  title: "Dokumentasi Pengguna — Scaff",
  description: "Panduan lengkap penggunaan CLI, integrasi layanan, FAQ, dan kontribusi template Scaff.",
};

export default function DocsPage() {
  const docs = getAllDocs();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero Header */}
      <div className="max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 mb-4">
          Documentation & Guides
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight mb-3">
          Dokumentasi Pengguna Scaff
        </h1>
        <p className="text-zinc-400 text-base leading-relaxed">
          Pelajari cara menggunakan CLI, memahami integrasi layanan lokal (Midtrans, Xendit, Supabase), serta standar membuat template baru.
        </p>
      </div>

      {/* Quick Start Command Box Callout */}
      <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">
            Mulai Cepat dalam 10 Detik
          </h2>
          <p className="text-xs text-zinc-400">
            Jalankan command ini di terminal tanpa perlu install package apapun terlebih dahulu.
          </p>
        </div>
        <div className="bg-[#0A0A0B] border border-[#26262B] rounded-lg px-4 py-2 font-mono text-sm text-[#FAFAFA] flex items-center gap-2 w-full md:w-auto">
          <span className="text-[#8B5CF6] font-bold">$</span>
          <span>npx scaffdev@latest</span>
        </div>
      </div>

      {/* Docs Grid Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((doc, idx) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="group flex flex-col bg-[#131316] border border-[#26262B] hover:border-[#8B5CF6]/60 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-[#8B5CF6]/5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-500 font-semibold">
                0{idx + 1}
              </span>
              <span className="text-xs text-[#8B5CF6] group-hover:translate-x-1 transition-transform">
                Baca Panduan →
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors mb-2">
              {doc.title}
            </h3>

            <p className="text-sm text-zinc-400 leading-relaxed flex-1">
              {doc.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}