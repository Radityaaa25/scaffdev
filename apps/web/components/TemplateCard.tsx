import React from "react";
import Link from "next/link";
import { Template } from "@scaff/database";
import { IntegrationBadge } from "./IntegrationBadge";

interface TemplateCardProps {
  template: Template;
}

function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}rb`;
  return `${n}`;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const downloads = template.downloads_count ?? 0;
  const hasIntegrations = template.opsi_integrasi.length > 0;

  return (
    <div className="flex flex-col bg-[#131316] border border-[#26262B] rounded-2xl overflow-hidden hover:border-[#8B5CF6]/60 transition-all hover:shadow-xl hover:shadow-[#8B5CF6]/10 hover:-translate-y-1 group">
      {/* 16:9 Image Preview */}
      <Link
        href={`/templates/${template.slug}`}
        className="relative aspect-video w-full bg-zinc-900 overflow-hidden block"
        aria-label={`Lihat detail ${template.nama}`}
      >
        {template.screenshot_url ? (
          <img
            src={template.screenshot_url}
            alt={template.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600 font-mono text-xs bg-gradient-to-br from-[#131316] to-[#0A0A0B]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 opacity-50">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Preview Belum Tersedia
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#0A0A0B]/80 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-300 border border-[#26262B]">
              {template.framework}
            </span>
            <span className="bg-[#8B5CF6]/20 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-medium text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase">
              {template.kategori}
            </span>
          </div>
          {downloads > 0 && (
            <span className="bg-[#0A0A0B]/80 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 border border-[#26262B]">
              ↓ {formatDownloads(downloads)}
            </span>
          )}
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        <Link href={`/templates/${template.slug}`}>
          <h3 className="text-lg font-semibold text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors mb-1.5 line-clamp-1">
            {template.nama}
          </h3>
        </Link>

        <p className="text-[11px] font-mono text-zinc-500 mb-2 truncate">
          {template.slug}
        </p>

        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {template.deskripsi || "Starter kit siap pakai untuk kebutuhan pengembangan Anda."}
        </p>

        {/* Integration Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 min-h-6">
          {hasIntegrations ? (
            <>
              {template.opsi_integrasi.slice(0, 3).map((integ) => (
                <IntegrationBadge key={integ} name={integ} />
              ))}
              {template.opsi_integrasi.length > 3 && (
                <span className="text-[11px] font-mono text-zinc-500">
                  +{template.opsi_integrasi.length - 3} lainnya
                </span>
              )}
            </>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-zinc-800/60 text-zinc-400 border-zinc-700/50">
              Basic — tanpa integrasi tambahan
            </span>
          )}
        </div>

        {/* Coming Soon hint */}
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-4">
          <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Coming Soon
          </span>
          Kombinasi integrasi custom
        </p>

        {/* Action Button */}
        <Link
          href={`/templates/${template.slug}`}
          className="w-full py-2.5 px-3 text-center text-sm font-medium rounded-xl bg-[#26262B] hover:bg-[#8B5CF6] text-[#FAFAFA] transition-all active:scale-[0.98]"
        >
          Lihat Detail & Command
        </Link>
      </div>
    </div>
  );
}
