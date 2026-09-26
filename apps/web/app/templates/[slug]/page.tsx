import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateBySlug, getAllTemplates } from "@/lib/data";
import { IntegrationBadge } from "@/components/IntegrationBadge";
import { TemplateActionBox } from "@/components/TemplateActionBox";
import { IntegrationPickerComingSoon } from "@/components/IntegrationPickerComingSoon";
import { TemplateCard } from "@/components/TemplateCard";
import { AskAI } from "@/components/AskAI";
import { JsonLd } from "@/components/JsonLd";
import {
  absoluteUrl,
  baseMetadata,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

interface TemplateDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) {
    return baseMetadata({ title: "Template tidak ditemukan" });
  }
  const name = template.nama || template.slug;
  const frameworkLabel = template.framework === "laravel" ? "Laravel" : "Next.js";
  const title = `${name} — Template ${frameworkLabel} Siap Pakai`;
  const description =
    template.deskripsi ||
    `Starter kit ${frameworkLabel} ${template.kategori} siap jalan dengan ${
      template.integrasi.length > 0
        ? `integrasi ${template.integrasi.map((i) => i.nama_tampilan).join(", ")}.`
        : "tanpa integrasi tambahan."
    } Generate via npx scaffdev@latest --template=${template.slug}.`;
  return baseMetadata({
    title,
    description,
    alternates: { canonical: absoluteUrl(`/templates/${template.slug}`) },
    openGraph: {
      type: "website",
      url: absoluteUrl(`/templates/${template.slug}`),
      title,
      description,
      ...(template.screenshot_url ? { images: [template.screenshot_url] } : {}),
    },
  });
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  const totalEnvVars = template.integrasi.reduce(
    (sum, item) => sum + item.daftar_env_var.length,
    0
  );

  // Related templates: kategori atau framework sama, selain dirinya sendiri.
  let related: Awaited<ReturnType<typeof getAllTemplates>> = [];
  try {
    const all = await getAllTemplates();
    related = all
      .filter(
        (t) =>
          t.slug !== template.slug &&
          (t.kategori === template.kategori || t.framework === template.framework)
      )
      .slice(0, 3);
  } catch {
    related = [];
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <AskAI />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Katalog Template", path: "/templates" },
          { name: template.nama || template.slug, path: `/templates/${template.slug}` },
        ])}
      />
      <JsonLd
        data={softwareApplicationJsonLd({
          name: template.nama || template.slug,
          description:
            template.deskripsi || `Starter kit ${template.framework} ${template.kategori}.`,
          urlPath: `/templates/${template.slug}`,
          framework: template.framework,
          image: template.screenshot_url,
        })}
      />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-mono" aria-label="Breadcrumb">
        <Link href="/templates" className="hover:text-zinc-300 transition-colors">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-zinc-400 capitalize">{template.kategori}</span>
        <span>/</span>
        <span className="text-[#8B5CF6] truncate">{template.slug}</span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
              {template.kategori}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-[#26262B] text-zinc-300 border border-[#26262B]">
              Framework: {template.framework}
            </span>
            {template.integrasi.length > 0 ? (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {template.integrasi.length} integrasi • {totalEnvVars} env var
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                Basic — polosan siap generate
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            {template.nama || template.slug}
          </h1>
          {template.deskripsi && (
            <p className="text-sm text-zinc-400 leading-relaxed mt-2 max-w-2xl">
              {template.deskripsi}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <a
            href="#pakai-template"
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all active:scale-[0.98]"
          >
            ⚡ Pakai Template Ini
          </a>
          <Link
            href="/templates"
            className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-2.5 rounded-xl border border-[#26262B] hover:bg-[#131316] transition-colors"
          >
            ← Katalog
          </Link>
        </div>
      </div>

      {/* Large Screenshot Preview (16:9) */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#26262B] bg-[#131316] shadow-2xl mb-2">
        {template.screenshot_url ? (
          <img
            src={template.screenshot_url}
            alt={template.nama || template.slug}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600 font-mono text-sm bg-gradient-to-br from-[#131316] to-[#0A0A0B]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 opacity-50">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Preview Screenshot Belum Tersedia
          </div>
        )}
      </div>

      {/* Action Box: Pakai Template Ini */}
      <TemplateActionBox slug={template.slug} framework={template.framework} />

      {/* Kombinasi custom via Builder (live) — preview + deep-link ?base= */}
      <IntegrationPickerComingSoon baseSlug={template.slug} />

      {/* Description & Integration Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Left Column: Description & Repo Details */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-[#131316] border border-[#26262B] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Tentang Template Ini
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {template.deskripsi || "Tidak ada deskripsi detail untuk template ini."}
            </p>
          </section>

          <section className="bg-[#131316] border border-[#26262B] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-4">
              Spesifikasi Repository
            </h2>
            <ul className="text-sm text-zinc-400 space-y-2 font-mono">
              <li className="flex items-center justify-between gap-3 border-b border-[#26262B] pb-2">
                <span>Slug Sistem:</span>
                <span className="text-[#8B5CF6] truncate">{template.slug}</span>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-[#26262B] pb-2">
                <span>Framework:</span>
                <span className="text-zinc-200">{template.framework}</span>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-[#26262B] pb-2">
                <span>Visibilitas:</span>
                <span className="text-emerald-400">Public (No Token Required)</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Target Repo:</span>
                <span className="text-zinc-300 text-xs truncate max-w-[280px]" title={template.repo_url}>
                  {template.repo_url}
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column: Included Integrations & Env Vars */}
        <div className="space-y-6">
          <div className="bg-[#131316] border border-[#26262B] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">
              Integrasi Bawaan
            </h2>
            <p className="text-[11px] text-zinc-500 mb-4">
              Sudah termasuk saat generate polosan.
            </p>
            {template.integrasi && template.integrasi.length > 0 ? (
              <div className="space-y-4">
                {template.integrasi.map((item) => (
                  <div
                    key={item.kode}
                    className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#26262B]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IntegrationBadge name={item.nama_tampilan} />
                      <span className="text-[11px] font-mono text-zinc-500">
                        {item.daftar_env_var.length} env var
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300 block mb-1">
                        Variable yang dibutuhkan:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-zinc-400">
                        {item.daftar_env_var.map((v) => (
                          <li key={v.key} className="truncate" title={`${v.key} — ${v.deskripsi}`}>
                            {v.key}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic leading-relaxed">
                Template ini berjenis Basic tanpa konfigurasi integrasi database atau payment tambahan — generate langsung jalan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related templates */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Template Terkait
            </h2>
            <Link href="/templates" className="text-xs font-medium text-[#8B5CF6] hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((t) => (
              <TemplateCard key={t.slug} template={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
