"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RocketIcon, BookIcon, PuzzleIcon, ChevronRightIcon } from "./DocsIcons";

export interface DocsSearchItem {
  slug: string;
  title: string;
  description: string;
  section: string;
}

const SECTION_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  Mulai: RocketIcon,
  Panduan: BookIcon,
  Referensi: PuzzleIcon,
};

export function DocsSearch({ docs }: { docs: DocsSearchItem[] }) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? docs.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(needle))
      : docs;
    const out: { section: string; items: DocsSearchItem[] }[] = [];
    for (const d of filtered) {
      const g = out.find((x) => x.section === d.section);
      if (g) g.items.push(d);
      else out.push({ section: d.section, items: [d] });
    }
    return out;
  }, [docs, q]);

  const total = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div>
      {/* Search Input */}
      <div className="mb-12">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari panduan… (mis. laravel, payment, error)"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-[#FAFAFA] placeholder:text-zinc-500 transition-all focus:border-[#8B5CF6]/50 focus:bg-white/10 focus:outline-none"
          />
        </div>
      </div>

      {/* Results */}
      {total === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8 text-zinc-500">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">
            Tidak ada panduan yang cocok. Coba kata kunci lain — atau tanyakan ke asisten AI di pojok kanan bawah.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((g, gi) => (
            <section key={g.section}>
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10 font-mono text-sm font-bold text-[#8B5CF6]">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  {g.section}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {g.items.map((doc) => {
                  const SectionIcon = SECTION_ICONS[doc.section] ?? BookIcon;
                  return (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 transition-all hover:-translate-y-1 hover:border-[#8B5CF6]/50 hover:shadow-lg hover:shadow-[#8B5CF6]/10"
                    >
                      {/* Gradient Accent */}
                      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#8B5CF6]/10 blur-2xl transition-all group-hover:bg-[#8B5CF6]/20" />
                      
                      <div className="relative">
                        {/* Header */}
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#8B5CF6] transition-all group-hover:scale-110 group-hover:border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/15">
                            <SectionIcon className="h-6 w-6" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#8B5CF6] transition-all group-hover:gap-2">
                            Baca
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="mb-2 text-lg font-semibold text-[#FAFAFA] transition-colors group-hover:text-[#8B5CF6]">
                          {doc.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-400">
                          {doc.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
