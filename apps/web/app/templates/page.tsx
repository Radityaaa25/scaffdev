"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Template } from "@scaff/database";
import { TemplateCard } from "@/components/TemplateCard";
import { AskAI } from "@/components/AskAI";
import { fetchTemplates } from "@/lib/api";

const KATEGORI_OPTIONS = [
  { value: "all", label: "Semua Kategori" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "landing-page", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
];

const FRAMEWORK_OPTIONS = [
  { value: "all", label: "Semua Framework" },
  { value: "nextjs", label: "Next.js" },
  { value: "laravel", label: "Laravel" },
];

function TemplatesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const selectedKategori = searchParams.get("kategori") || "all";
  const selectedFramework = searchParams.get("framework") || "all";

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchTemplates();
      setAllTemplates(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const updateFilters = (newKategori: string, newFramework: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newKategori === "all") {
      params.delete("kategori");
    } else {
      params.set("kategori", newKategori);
    }

    if (newFramework === "all") {
      params.delete("framework");
    } else {
      params.set("framework", newFramework);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const filteredTemplates = allTemplates.filter((item) => {
    const matchKategori =
      selectedKategori === "all" || item.kategori === selectedKategori;
    const matchFramework =
      selectedFramework === "all" || item.framework === selectedFramework;
    return matchKategori && matchFramework;
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight mb-3">
          Katalog Template <span className="text-[#8B5CF6]">Scaff</span>
        </h1>
        <p className="text-zinc-400 text-base">
          Jelajahi seluruh starter kit siap pakai dengan arsitektur folder best-practice, UI responsif, dan kurasi integrasi lokal.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131316] border border-[#26262B] rounded-xl p-4 mb-8">
        {/* Kategori Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">
            Kategori:
          </span>
          {KATEGORI_OPTIONS.map((opt) => {
            const isActive = selectedKategori === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateFilters(opt.value, selectedFramework)}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/30"
                    : "bg-[#26262B] text-zinc-300 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Framework Dropdown / Chips */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">
            Framework:
          </span>
          {FRAMEWORK_OPTIONS.map((opt) => {
            const isActive = selectedFramework === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateFilters(selectedKategori, opt.value)}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/30"
                    : "bg-[#26262B] text-zinc-300 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#131316] border border-[#26262B] rounded-xl h-72"
            />
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.slug} template={template} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#131316] border border-[#26262B] rounded-xl">
          <p className="text-zinc-400 text-sm mb-3">
            Tidak ada template yang cocok dengan filter yang dipilih.
          </p>
          <button
            onClick={() => updateFilters("all", "all")}
            className="text-xs font-medium text-[#8B5CF6] hover:underline"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16 text-zinc-500 font-mono text-sm">
          Memuat katalog template...
        </div>
      }
    >
      <TemplatesContent />
      <AskAI />
    </Suspense>
  );
}