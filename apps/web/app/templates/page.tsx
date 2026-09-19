import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplatesCatalog } from "@/components/TemplatesCatalog";
import { AskAI } from "@/components/AskAI";
import { JsonLd } from "@/components/JsonLd";
import { getAllTemplates } from "@/lib/data";
import { absoluteUrl, baseMetadata, itemListJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = baseMetadata({
  title: "Katalog Template — Scaffdev",
  description:
    "Jelajahi starter kit Next.js & Laravel siap pakai: e-commerce, landing page, portfolio dengan integrasi Supabase, Midtrans, Xendit, RajaOngkir. Generate via npx scaffdev@latest.",
  keywords: [
    "katalog template",
    "starter kit Next.js Indonesia",
    "template Laravel Indonesia",
    "template e-commerce",
    "template landing page",
    "boilerplate Midtrans",
    "boilerplate Supabase",
  ],
  alternates: { canonical: absoluteUrl("/templates") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/templates"),
    title: "Katalog Template — Scaffdev",
    description:
      "Starter kit Next.js & Laravel siap jalan: e-commerce, landing page, portfolio + integrasi lokal. Generate via npx scaffdev@latest.",
  },
});

export default async function TemplatesPage() {
  let initialTemplates: Awaited<ReturnType<typeof getAllTemplates>> = [];
  try {
    initialTemplates = await getAllTemplates();
  } catch {
    initialTemplates = [];
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16 text-zinc-500 font-mono text-sm">
          Memuat katalog template...
        </div>
      }
    >
      <JsonLd
        data={itemListJsonLd(
          "Katalog Template Scaffdev",
          "Starter kit Next.js & Laravel siap pakai dengan kurasi integrasi lokal Indonesia.",
          "/templates",
          initialTemplates.slice(0, 50).map((t) => ({
            name: t.nama,
            path: `/templates/${t.slug}`,
          }))
        )}
      />
      <TemplatesCatalog initialTemplates={initialTemplates} />
      <AskAI />
    </Suspense>
  );
}
