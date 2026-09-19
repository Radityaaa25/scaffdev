import type { Metadata } from "next";
import Link from "next/link";
import { LaporForm } from "@/components/LaporForm";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, baseMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "Lapor Bug & Pengaduan — Scaffdev",
  description:
    "Laporkan bug, error, saran, atau pengaduan seputar Scaffdev. Tanpa login, langsung dibaca tim kami.",
  alternates: { canonical: absoluteUrl("/lapor") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/lapor"),
    title: "Lapor Bug & Pengaduan — Scaffdev",
    description: "Laporkan bug, saran, atau pengaduan seputar Scaffdev tanpa login.",
  },
});

export default function LaporPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Lapor Bug & Pengaduan", path: "/lapor" },
        ])}
      />
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-mono" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-zinc-300 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <span className="text-[#8B5CF6]">Lapor</span>
      </nav>

      <div className="mb-8 text-center">
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
          Bantuan Pengguna
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
          Lapor Bug & Pengaduan
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          Temu bug, error, atau punya saran? Ceritakan di sini — tanpa perlu login.
          Untuk panduan mandiri, cek{" "}
          <Link href="/docs/troubleshooting" className="text-[#A78BFA] hover:underline">Troubleshooting</Link>{" "}
          dulu. Atau email langsung ke{" "}
          <a href="mailto:scaffdev.support@gmail.com" className="text-[#A78BFA] hover:underline">
            scaffdev.support@gmail.com
          </a>.
        </p>
      </div>

      <LaporForm />
    </div>
  );
}
