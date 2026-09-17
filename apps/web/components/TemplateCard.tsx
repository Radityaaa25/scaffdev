import React from "react";
import Link from "next/link";
import { Template } from "@scaff/database";
import { IntegrationBadge } from "./IntegrationBadge";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="flex flex-col bg-[#131316] border border-[#26262B] rounded-xl overflow-hidden hover:border-[#8B5CF6]/60 transition-all hover:shadow-lg hover:shadow-[#8B5CF6]/5 group">
      {/* 16:9 Image Preview */}
      <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
        {template.screenshot_url ? (
          <img
            src={template.screenshot_url}
            alt={template.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
            Preview Belum Tersedia
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <span className="bg-[#0A0A0B]/80 backdrop-blur px-2 py-0.5 rounded text-[11px] font-mono text-zinc-300 border border-[#26262B]">
            {template.framework}
          </span>
          <span className="bg-[#8B5CF6]/20 backdrop-blur px-2 py-0.5 rounded text-[11px] font-medium text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase">
            {template.kategori}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-semibold text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors mb-2">
          {template.nama}
        </h3>

        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
          {template.deskripsi || "Starter kit siap pakai untuk kebutuhan pengembangan Anda."}
        </p>

        {/* Integration Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-5 min-h-6">
          {template.opsi_integrasi.length > 0 ? (
            template.opsi_integrasi.map((integ) => (
              <IntegrationBadge key={integ} name={integ} />
            ))
          ) : (
            <span className="text-xs text-zinc-500 italic">Tanpa integrasi tambahan (Basic)</span>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={`/templates/${template.slug}`}
          className="w-full py-2 px-3 text-center text-sm font-medium rounded-lg bg-[#26262B] hover:bg-[#8B5CF6] text-[#FAFAFA] transition-colors"
        >
          Lihat Detail & Command
        </Link>
      </div>
    </div>
  );
}
