"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRightIcon } from "./DocsIcons";

function GridIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export interface SidebarDoc {
  slug: string;
  title: string;
  section: string;
}

/**
 * Navigasi dokumentasi sidebar dengan active state dan scrollspy
 */
export function DocsSidebar({ docs }: { docs: SidebarDoc[] }) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSlug = pathname.startsWith("/docs/")
    ? decodeURIComponent(pathname.slice("/docs/".length))
    : undefined;
  const isIndex = pathname === "/docs";

  const groups: { section: string; items: SidebarDoc[] }[] = [];
  for (const d of docs) {
    const g = groups.find((x) => x.section === d.section);
    if (g) g.items.push(d);
    else groups.push({ section: d.section, items: [d] });
  }

  const nav = (
    <nav aria-label="Navigasi dokumentasi" className="space-y-8">
      <Link
        href="/docs"
        aria-current={isIndex ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isIndex
            ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        }`}
      >
        <GridIcon className={`h-4 w-4 transition-colors ${isIndex ? "text-[#8B5CF6]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
        Semua Panduan
      </Link>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.section} aria-label={g.section}>
            <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {g.section}
            </h2>
            <ul className="space-y-1">
              {g.items.map((item) => {
                const isActive = item.slug === activeSlug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive
                          ? "bg-[#8B5CF6]/10 font-medium text-[#FAFAFA]"
                          : "font-normal text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      }`}
                    >
                      <span className="flex-1 truncate">{item.title}</span>
                      {isActive && (
                        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile navigation toggle */}
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 backdrop-blur-sm transition-all hover:bg-white/10"
        >
          <span className="flex items-center gap-2.5">
            <GridIcon className="h-4 w-4 text-zinc-400" />
            Daftar Panduan
          </span>
          <ChevronRightIcon className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${mobileOpen ? "rotate-90" : ""}`} />
        </button>
        {mobileOpen && (
          <div className="animate-docs-popup mt-3 rounded-xl border border-white/10 bg-[#0A0A0B]/95 p-5 backdrop-blur-xl">
            {nav}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{nav}</div>
    </>
  );
}
