import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateBySlug } from "@/lib/data";
import { IntegrationBadge } from "@/components/IntegrationBadge";
import { TemplateActionBox } from "@/components/TemplateActionBox";

interface TemplateDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-mono">
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
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
              {template.kategori}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-[#26262B] text-zinc-300 border border-[#26262B]">
              Framework: {template.framework}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA]">
            {template.nama || template.slug}
          </h1>
        </div>

        <Link
          href="/templates"
          className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#26262B] hover:bg-[#131316] transition-colors self-start md:self-auto"
        >
          ← Kembali ke Katalog
        </Link>
      </div>

      {/* Large Screenshot Preview (16:9) */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#26262B] bg-[#131316] shadow-2xl mb-8">
        {template.screenshot_url ? (
          <img
            src={template.screenshot_url}
            alt={template.nama || template.slug}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-sm">
            Preview Screenshot Belum Tersedia
          </div>
        )}
      </div>

      {/* Action Box: Pakai Template Ini */}
      <TemplateActionBox slug={template.slug} framework={template.framework} />

      {/* Description & Integration Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {/* Left Column: Description & Repo Details */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Tentang Template Ini
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {template.deskripsi || "Tidak ada deskripsi detail untuk template ini."}
            </p>
          </section>

          <section className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
              Spesifikasi Repository
            </h2>
            <ul className="text-sm text-zinc-400 space-y-2 font-mono">
              <li className="flex items-center justify-between border-b border-[#26262B] pb-2">
                <span>Slug Sistem:</span>
                <span className="text-[#8B5CF6]">{template.slug}</span>
              </li>
              <li className="flex items-center justify-between border-b border-[#26262B] pb-2">
                <span>Visibilitas:</span>
                <span className="text-emerald-400">Public (No Token Required)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Target Repo:</span>
                <span className="text-zinc-300 text-xs truncate max-w-[280px]">
                  {template.repo_url}
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column: Included Integrations & Env Vars */}
        <div className="space-y-6">
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#FAFAFA] mb-4">
              Integrasi Tersedia
            </h2>
            {template.integrasi && template.integrasi.length > 0 ? (
              <div className="space-y-4">
                {template.integrasi.map((item) => (
                  <div
                    key={item.kode}
                    className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#26262B]"
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
                          <li key={v.key} className="truncate" title={v.deskripsi}>
                            {v.key}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Template ini berjenis Basic tanpa konfigurasi integrasi database atau payment tambahan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}