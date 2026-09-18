"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, DocIcon, CornerEnterIcon } from "./DocsIcons";

export interface SpotlightDoc {
  slug: string;
  title: string;
  description: string;
  section: string;
}

/** Topbar Docs dengan brand, search spotlight (Cmd/Ctrl+K), dan GitHub link */
export function DocsTopbar({ docs }: { docs: SpotlightDoc[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="flex w-full items-center gap-4">
        {/* Brand Section */}
        <Link href="/docs" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-base font-bold text-white shadow-lg shadow-[#8B5CF6]/25">
            S
          </span>
          <div className="hidden items-baseline gap-1.5 sm:flex">
            <span className="text-base font-semibold text-[#FAFAFA]">Scaffdev</span>
            <span className="text-sm font-normal text-zinc-500">Docs</span>
          </div>
        </Link>

        {/* Version Badge */}
        <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400 lg:inline-block">
          v0.1
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full max-w-md items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all hover:border-[#8B5CF6]/40 hover:bg-white/10"
        >
          <SearchIcon className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-zinc-300" />
          <span className="flex-1 text-left text-zinc-500 transition-colors group-hover:text-zinc-300">
            Cari dokumentasi…
          </span>
          <kbd className="hidden rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400 sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Radityaaa25/scaffdev"
          target="_blank"
          rel="noreferrer"
          title="GitHub Scaffdev"
          className="hidden shrink-0 rounded-lg border border-white/10 p-2 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white sm:block"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
        </a>
      </div>

      {open && <Spotlight docs={docs} onClose={() => setOpen(false)} />}
    </>
  );
}

function Spotlight({ docs, onClose }: { docs: SpotlightDoc[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleQueryChange(value: string) {
    setQ(value);
    setCursor(0);
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? docs.filter((d) => `${d.title} ${d.description} ${d.section}`.toLowerCase().includes(needle))
      : docs;
    return list.slice(0, 8);
  }, [docs, q]);

  function go(slug: string) {
    onClose();
    router.push(`/docs/${slug}`);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian dokumentasi"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B]/95 shadow-2xl shadow-black/80 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <SearchIcon className="h-5 w-5 text-zinc-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && results[cursor]) {
                go(results[cursor].slug);
              }
            }}
            placeholder="Cari panduan, error, integrasi…"
            className="flex-1 bg-transparent text-base text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400">
            esc
          </kbd>
        </div>

        {/* Results List */}
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-zinc-500">
              Tidak ketemu — coba kata kunci lain atau tanyakan ke asisten AI ✦
            </li>
          )}
          {results.map((d, i) => (
            <li key={d.slug}>
              <button
                type="button"
                onClick={() => go(d.slug)}
                onMouseEnter={() => setCursor(i)}
                className={`flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition-all ${
                  cursor === i ? "bg-[#8B5CF6]/15" : "hover:bg-white/5"
                }`}
              >
                <DocIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" />
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${cursor === i ? "text-white" : "text-zinc-200"}`}>
                    {d.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">
                    {d.section} · /docs/{d.slug}
                  </div>
                </div>
                <CornerEnterIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-600" />
              </button>
            </li>
          ))}
        </ul>

        {/* Footer Commands */}
        <div className="flex items-center gap-6 border-t border-white/10 px-5 py-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">↑↓</kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">↵</kbd>
            buka
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">esc</kbd>
            tutup
          </span>
        </div>
      </div>
    </div>
  );
}
