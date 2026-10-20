import type { Metadata } from "next";
import Link from "next/link";
import { KontribusiForm } from "@/components/KontribusiForm";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, baseMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "Kontribusi Template | Scaffdev",
  description:
    "Ajukan template Next.js atau Laravel buatanmu untuk masuk katalog Scaffdev. Tim akan mengaudit commit, struktur, dan keamanannya sebelum publish.",
  alternates: { canonical: absoluteUrl("/kontribusi") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/kontribusi"),
    title: "Kontribusi Template | Scaffdev",
    description: "Ajukan template komunitas untuk katalog Scaffdev.",
  },
});

export default function KontribusiPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Kontribusi Template", path: "/kontribusi" },
        ])}
      />
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-zinc-300">Beranda</Link>
        <span>/</span>
        <span className="text-[#8B5CF6]">Kontribusi</span>
      </nav>

      <div className="mb-8 text-center">
        <span className="inline-flex items-center rounded border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#A78BFA]">
          Community Drop
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#FAFAFA] sm:text-4xl">
          Kontribusi Template
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Punya starter kit Next.js atau Laravel yang rapi? Ajukan repo publiknya.
          Tim akan audit commit, cek keamanan dan struktur, lalu mirror ke organisasi
          <span className="font-mono text-zinc-300"> scaffdev</span> sebelum publish.
          Baca dulu{" "}
          <Link href="/docs/cara-kontribusi-template" className="text-[#A78BFA] hover:underline">
            panduan kontribusi
          </Link>.
        </p>
      </div>

      <KontribusiForm />
    </div>
  );
}
