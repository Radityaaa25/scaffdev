"use client";

import { useState } from "react";
import Link from "next/link";

const HERO_COMMAND = "npx scaffdev@latest";

/**
 * Hero ala ReactBits: eyebrow pill, display headline raksasa,
 * CTA primer putih + sekunder mono, stats row, panel tab Preview/Code.
 */
export function BitsHero({ templateCount }: { templateCount: number }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(HERO_COMMAND);
    } catch {
      /* abaikan */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const stats: Array<[string, string]> = [
    [templateCount > 0 ? `${templateCount}` : "—", "Template live"],
    ["2", "Framework"],
    ["6", "Integrasi lokal"],
    ["MIT", "Open-source"],
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16">
        <p className="hero-enter hero-enter-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-4 text-xs text-zinc-400 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {templateCount > 0 ? (
            <span><span className="font-semibold text-zinc-200">{templateCount} template</span> live dari database</span>
          ) : (
            <span>Starter kit Next.js & Laravel untuk Indonesia</span>
          )}
        </p>

        <h1
          className="hero-enter hero-enter-2 mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl"
        >
          Ship project{" "}
          <span className="bg-gradient-to-r from-[#C4B5FD] via-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
            hari ini,
          </span>
          <br />
          bukan minggu depan.
        </h1>

        <p className="hero-enter hero-enter-3 mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Scaffolding generator: starter kit siap jalan dengan tampilan visual jadi dan
          kurasi integrasi lokal Indonesia. Satu baris command, langsung bisa dikembangkan.
        </p>

        <div className="hero-enter hero-enter-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/templates"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] sm:w-auto"
          >
            Jelajahi Template
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 font-mono text-sm text-zinc-200 transition-all hover:border-[#8B5CF6]/50 hover:text-white active:scale-[0.98] sm:w-auto"
            title="Salin command"
          >
            <span className="text-[#8B5CF6]">$</span> npx scaffdev@latest
            <span className="text-xs text-zinc-500">{copied ? "✓ tersalin" : "salin"}</span>
          </button>
        </div>

        <dl className="hero-enter hero-enter-5 mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l} className="bg-[#0A0A0B] px-4 py-4">
              <dt className="order-2 mt-1 block text-[11px] uppercase tracking-wider text-zinc-500">{l}</dt>
              <dd className="order-1 text-2xl font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>

        {/* Panel tab Preview / Code ala halaman detail ReactBits */}
        <div className="hero-enter hero-enter-5 mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131316] text-left">
          <div className="flex items-center gap-1 border-b border-white/[0.06] p-2" role="tablist" aria-label="Preview atau code">
            {(["preview", "code"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                type="button"
                className={`rounded-lg px-4 py-1.5 font-mono text-xs font-medium capitalize transition-all ${
                  tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "code" ? "</> Code" : "◉ Preview"}
              </button>
            ))}
            <span className="ml-auto hidden font-mono text-[11px] text-zinc-600 sm:block">bash — terminal</span>
          </div>
          {tab === "preview" ? (
            <div className="hero-term-body" role="tabpanel">
              <pre className="hero-term-pre"><code>$&nbsp;</code><code>npx&nbsp;</code><code className="hero-term-cmd" data-cmd="scaffdev@latest" /></pre>
              <p className="hero-term-out">
                <span>✓</span>
                <span className="dim">Project berhasil dibuat — happy coding!</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-4 font-mono text-sm" role="tabpanel">
              <p className="overflow-x-auto whitespace-nowrap text-zinc-200">
                <span className="select-none font-bold text-[#8B5CF6]">$ </span>npx scaffdev@latest
              </p>
              <button
                onClick={handleCopy}
                type="button"
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#8B5CF6] active:scale-95"
              >
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
