"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteSearch } from "./SiteSearch";

const GITHUB_URL = "https://github.com/Radityaaa25/scaffdev";

const NAV_LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/builder", label: "Builder" },
  { href: "/docs", label: "Docs" },
];

/** Floating pill navbar global. Disembunyikan di /docs (sudah ada DocsTopbar sendiri). */
export function SiteNavbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Menu mobile ditutup via onClick tiap link (tanpa effect agar lolos lint).

  if (pathname?.startsWith("/docs")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <>
      {/* Spacer agar konten tidak tertutup navbar fixed */}
      <div className="h-20" aria-hidden="true" />

      <header className="fixed inset-x-0 top-3 z-[80] flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="Navigasi utama"
          className="pointer-events-auto flex w-full max-w-7xl items-center gap-2 rounded-2xl border border-white/10 bg-[#0A0A0B]/85 py-2 pl-3 pr-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Scaffdev - Beranda">
            <img
              src="/logo-full.png"
              alt="Scaffdev"
              className="hidden h-9 w-auto sm:block"
              loading="eager"
            />
            <img
              src="/logo-icon.png"
              alt="Scaffdev"
              className="h-9 w-9 sm:hidden"
              loading="eager"
            />
          </Link>

          {/* Desktop links — kanan, di samping GitHub */}
          <div className="flex-1" />

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  isActive(link.href)
                    ? "bg-[#8B5CF6]/15 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* GitHub */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            title="GitHub Scaffdev"
            className="hidden rounded-lg border border-white/10 p-2 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white sm:block"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition-all hover:bg-white/5 hover:text-white md:hidden"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile dropdown — sejajar dengan navbar */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-[4.25rem] z-[80] flex justify-center px-4 md:hidden">
          <div className="w-full max-w-7xl rounded-2xl border border-white/10 bg-[#0A0A0B]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm transition-all ${
                  isActive(link.href)
                    ? "bg-[#8B5CF6]/15 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl px-4 py-2.5 text-sm text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      )}

      {searchOpen && <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
