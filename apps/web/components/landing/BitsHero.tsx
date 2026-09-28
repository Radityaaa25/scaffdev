"use client";

import { useState } from "react";
import Link from "next/link";

const HERO_COMMAND = "npx scaffdev@latest";

/**
 * Hero ala ReactBits: eyebrow pill, display headline raksasa,
 * CTA primer putih + sekunder mono, stats row, panel tab Preview/Code.
 */
export function BitsHero({ templateCount }: { templateCount: number }) {
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
            <span><span className="font-semibold text-zinc-200">{templateCount} template</span> tersedia</span>
          ) : (
            <span>Starter kit Next.js & Laravel untuk Indonesia</span>
          )}
        </p>

        <h1
          className="hero-enter hero-enter-2 mx-auto mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl"
        >
          Hemat token{" "}
          <span className="text-[#8B5CF6]">
            AI-mu,
          </span>
          <br />
          cukup setup dengan <span className="text-[#8B5CF6]">Scaffdev.</span>
        </h1>

        {/* Kartu terminal animasi ketik — copy dari hero halaman template */}
        <div className="hero-enter hero-enter-3 relative mx-auto mt-8 w-full max-w-2xl">
          <div className="hero-term-float hero-term-float-1">
            <span className="dot bg-emerald-400" />
            Supabase connected
          </div>
          <div className="hero-term-float hero-term-float-2">
            <span className="dot bg-[#8B5CF6]" />
            Midtrans ready
          </div>
          <div className="hero-term-card">
            <div className="hero-term-glow" aria-hidden="true" />
            <div className="hero-term-wrap">
              <div className="hero-term-terminal">
                <div className="hero-term-head">
                  <div className="hero-term-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="hero-term-title">
                    <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                      <path d="M7 15L10 12L7 9M13 15H17M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 20.3854 3.6146 20.673 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 3.80354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" />
                    </svg>
                    terminal — bash
                  </p>
                  <button
                    className={`hero-term-copy${copied ? " copied" : ""}`}
                    onClick={handleCopy}
                    type="button"
                    aria-label={copied ? "Tersalin!" : "Salin command"}
                    title={copied ? "Tersalin!" : "Salin command"}
                  >
                    {copied ? (
                      <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                        <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                        <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="hero-term-body">
                  <pre className="hero-term-pre"><code>$&nbsp;</code><code>npx&nbsp;</code><code className="hero-term-cmd" data-cmd="scaffdev@latest" /></pre>
                  <p className="hero-term-out">
                    <span>✓</span>
                    <span className="dim">Project berhasil dibuat — happy coding!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 pl-1 text-left font-mono text-[11px] text-zinc-500">
            {copied ? "✓ Command tersalin — tempel di terminal" : "Satu baris command untuk generate project"}
          </p>
        </div>

        <div className="hero-enter hero-enter-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/templates"
            className="btn-gooey group w-full sm:w-auto"
          >
            Jelajahi Template
            <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">→</span>
            <span className="btn-gooey__blobs" aria-hidden="true">
              <div />
              <div />
              <div />
            </span>
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" aria-hidden="true" style={{ display: "block", height: 0, width: 0, position: "absolute" }}>
            <defs>
              <filter id="btn-gooey-filter">
                <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
          <Link
            href="/docs"
            className="btn-bubbles w-full sm:w-auto"
          >
            <span className="text">Baca Dokumentasi</span>
          </Link>
        </div>

        <dl className="hero-enter hero-enter-5 mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l} className="bg-[#0A0A0B] px-4 py-4">
              <dt className="order-2 mt-1 block text-[11px] uppercase tracking-wider text-zinc-500">{l}</dt>
              <dd className="order-1 text-2xl font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>

      </div>
    </section>
  );
}
