import type { Metadata } from "next";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { BitsHero } from "@/components/landing/BitsHero";
import { AboutBento } from "@/components/landing/AboutBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FaqCta } from "@/components/landing/FaqCta";
import { AskAI } from "@/components/AskAI";
import { JsonLd } from "@/components/JsonLd";
import type { Template } from "@scaff/database";
import { absoluteUrl, baseMetadata, itemListJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = baseMetadata({
  title: "Scaffdev — Starter Kit Next.js & Laravel Siap Jalan",
  description:
    "Hemat token AI-mu, cukup setup dengan Scaffdev. Starter kit Next.js & Laravel dengan tampilan visual jadi dan kurasi integrasi Indonesia — generate via npx scaffdev@latest.",
  keywords: [
    "scaffolding generator Indonesia",
    "starter kit Next.js",
    "template Laravel",
    "boilerplate Indonesia",
    "integrasi Midtrans",
    "integrasi Supabase",
    "npx scaffdev",
  ],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: "Scaffdev — Starter Kit Next.js & Laravel Siap Jalan",
    description:
      "Starter kit siap demo dengan kurasi integrasi lokal Indonesia. Satu baris command: npx scaffdev@latest.",
  },
});

export default async function LandingPage() {
  // Dynamic import agar landing tetap render (empty state) bila env Supabase
  // belum terisi di local — createClient throw saat modul lib/data dievaluasi.
  let initialTemplates: Template[] = [];
  try {
    const { getAllTemplates } = await import("@/lib/data");
    initialTemplates = await getAllTemplates();
  } catch {
    initialTemplates = [];
  }

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Backdrop: grid tajam + glow violet melayang acak. Satu layer full
          1 halaman, tanpa garis pemisah antar-section. */}
      <LandingBackdrop />
      <JsonLd
        data={itemListJsonLd(
          "Template Scaffdev",
          "Starter kit Next.js & Laravel siap pakai dengan kurasi integrasi lokal Indonesia.",
          "/templates",
          initialTemplates.slice(0, 20).map((t) => ({
            name: t.nama,
            path: `/templates/${t.slug}`,
          }))
        )}
      />
      <BitsHero templateCount={initialTemplates.length} />
      <AboutBento templateCount={initialTemplates.length} />
      <HowItWorks />
      <FaqCta />
      <AskAI />
    </main>
  );
}
