import type { Metadata } from "next";
import "@/components/landing/landing.css";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { TemplatesHero } from "@/components/TemplatesHero";
import { AboutBento } from "@/components/landing/AboutBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BuilderTeaser } from "@/components/landing/BuilderTeaser";
import { FaqCta } from "@/components/landing/FaqCta";
import { AskAI } from "@/components/AskAI";
import { JsonLd } from "@/components/JsonLd";
import type { Template } from "@scaff/database";
import { absoluteUrl, baseMetadata, itemListJsonLd } from "@/lib/seo";
import { FAQS, faqPageJsonLd } from "@/lib/faq";

export const revalidate = 3600;

/**
 * OG image khusus landing: sengaja didefinisikan lokal (bukan di lib/seo)
 * supaya file landing tidak bergantung pada export baru di modul shared.
 */
const LANDING_OG_IMAGE = {
  url: absoluteUrl("/og.png"),
  width: 1200,
  height: 630,
  alt: "Scaffdev: Starter Kit Next.js & Laravel Siap Jalan",
};

export const metadata: Metadata = baseMetadata({
  title: "Scaffdev: Starter Kit Next.js & Laravel Siap Jalan",
  description:
    "Hemat token AI-mu, cukup setup dengan Scaffdev. Starter kit Next.js & Laravel dengan tampilan visual jadi dan kurasi integrasi Indonesia: generate via npx scaffdev@latest.",
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
    title: "Scaffdev: Starter Kit Next.js & Laravel Siap Jalan",
    description:
      "Starter kit siap demo dengan kurasi integrasi lokal Indonesia. Satu baris command: npx scaffdev@latest.",
    images: [LANDING_OG_IMAGE],
  },
});

export default async function LandingPage() {
  // Dynamic import agar landing tetap render (empty state) bila env Supabase
  // belum terisi di local: createClient throw saat modul lib/data dievaluasi.
  let initialTemplates: Template[] = [];
  try {
    const { getAllTemplates } = await import("@/lib/data");
    initialTemplates = await getAllTemplates();
  } catch {
    initialTemplates = [];
  }

  return (
    <main className="landing-root relative flex flex-1 flex-col">
      {/* landing-root = scope CSS landing (components/landing/landing.css).
          Tanpa class ini rule landing tidak match; halaman docs/builder/
          templates tidak pernah punya class ini sehingga CSS tidak bocor
          ke mereka walau stylesheet-nya ikut terbundel. */}
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
      <JsonLd data={faqPageJsonLd(FAQS)} />
      {/* Samakan lebar hero dengan konten lain: max-w-7xl + padding horizontal. */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <TemplatesHero />
      </div>
      <AboutBento templateCount={initialTemplates.length} />
      <HowItWorks />
      <BuilderTeaser />
      <FaqCta />
      <AskAI />
    </main>
  );
}
