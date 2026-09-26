import type { Metadata } from "next";
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
      {/* Backdrop landing: base template (grid + orb) + wash atas + grain + vignette.
          Satu layer full 1 halaman, tanpa garis pemisah antar-section. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Wash violet lembut di belakang hero */}
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(139,92,246,0.12),transparent_70%)]" />
        {/* Grid template, fade halus sampai bawah */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(90% 75% at 50% 0%, black 30%, transparent 95%)",
            WebkitMaskImage: "radial-gradient(90% 75% at 50% 0%, black 30%, transparent 95%)",
          }}
        />
        {/* Orb template + 1 aksen tengah, melayang pelan */}
        <div className="bg-float-a absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-[#8B5CF6]/15 blur-[120px]" />
        <div className="bg-float-b absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#8B5CF6]/[0.07] blur-[130px]" />
        <div className="bg-float-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#8B5CF6]/10 blur-[120px]" style={{ animationDelay: "-7s" }} />
        <div className="bg-float-b absolute left-[-6rem] top-[58%] h-64 w-64 rounded-full bg-[#8B5CF6]/[0.07] blur-[130px]" style={{ animationDelay: "-4s" }} />
        {/* Grain halus + vignette tepi agar fokus ke tengah */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_60%,rgba(0,0,0,0.5)_100%)]" />
      </div>
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
