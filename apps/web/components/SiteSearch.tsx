"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, DocIcon, CornerEnterIcon } from "./DocsIcons";

interface TemplateHit {
  slug: string;
  nama: string;
  deskripsi?: string | null;
  kategori: string;
  framework: string;
}

interface DocHit {
  slug: string;
  title: string;
  description: string;
  section: string;
}

type Hit =
  | { kind: "template"; slug: string; title: string; subtitle: string }
  | { kind: "doc"; slug: string; title: string; subtitle: string };

/** Global spotlight search: templates + docs. Dibuka via tombol navbar atau Cmd/Ctrl+K. */
export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [templates, setTemplates] = useState<TemplateHit[]>([]);
  const [docs, setDocs] = useState<DocHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tRes, dRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/docs"),
        ]);
        if (cancelled) return;
        if (tRes.ok) {
          const t = await tRes.json();
          setTemplates(t.templates ?? []);
        }
        if (dRes.ok) {
          const d = await dRes.json();
          setDocs(d.docs ?? []);
        }
      } catch {
        /* hasil kosong — tampilkan pesan tidak ketemu */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  const results: Hit[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const tHits: Hit[] = (needle
      ? templates.filter((t) =>
          `${t.nama} ${t.deskripsi ?? ""} ${t.slug} ${t.kategori} ${t.framework}`
            .toLowerCase()
            .includes(needle)
        )
      : templates
    )
      .slice(0, 5)
      .map((t) => ({
        kind: "template" as const,
        slug: t.slug,
        title: t.nama,
        subtitle: `Template • ${t.kategori} • ${t.framework}`,
      }));
    const dHits: Hit[] = (needle
      ? docs.filter((d) =>
          `${d.title} ${d.description} ${d.section}`.toLowerCase().includes(needle)
        )
      : docs
    )
      .slice(0, 5)
      .map((d) => ({
        kind: "doc" as const,
        slug: d.slug,
        title: d.title,
        subtitle: `${d.section} • /docs/${d.slug}`,
      }));
    return [...tHits, ...dHits].slice(0, 10);
  }, [q, templates, docs]);

  function go(hit: Hit) {
    onClose();
    router.push(hit.kind === "template" ? `/templates/${hit.slug}` : `/docs/${hit.slug}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian situs"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B]/95 shadow-2xl shadow-black/80 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <SearchIcon className="h-5 w-5 text-zinc-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && results[cursor]) {
                go(results[cursor]);
              }
            }}
            placeholder="Cari template, panduan, error…"
            className="flex-1 bg-transparent text-base text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400">
            esc
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-zinc-500">
              Tidak ketemu — coba kata kunci lain ✦
            </li>
          )}
          {results.map((hit, i) => (
            <li key={`${hit.kind}-${hit.slug}`}>
              <button
                type="button"
                onClick={() => go(hit)}
                onMouseEnter={() => setCursor(i)}
                className={`flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition-all ${
                  cursor === i ? "bg-[#8B5CF6]/15" : "hover:bg-white/5"
                }`}
              >
                {hit.kind === "template" ? (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#8B5CF6]/20 font-mono text-[11px] font-bold text-[#8B5CF6]">
                    T
                  </span>
                ) : (
                  <DocIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${cursor === i ? "text-white" : "text-zinc-200"}`}>
                    {hit.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{hit.subtitle}</div>
                </div>
                <CornerEnterIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-600" />
              </button>
            </li>
          ))}
        </ul>

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
